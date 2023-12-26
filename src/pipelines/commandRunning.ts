import { BehaviorSubject, OperatorFunction, Subject, concatMap, filter, finalize, first, from, map, mergeMap, of, tap } from "../deps/rxjs.ts";
import { RenderedTranscript } from "../utils/templateRendering.ts";

export type UcmCommand = {
  args: string[],
  // TODO: flags, etc
}

export type UcmCommandResult = {
  code: number,
  stdout: string,
  stderr: string,
}

type TrackedCommand = {
  id: string,
  command: UcmCommand,
}

type TrackedCommandResult = {
  id: string,
  result: UcmCommandResult,
}

export type TranscriptOutput = {
  output: string,
  error?: string,
}

// Create a subject to act as the central stream of events
const inputLock = new Subject<TrackedCommand>();
const outputLock = new Subject<TrackedCommandResult>();

// Define the pipeline with concatMap to ensure sequential processing
inputLock.pipe(
  concatMap(async (event) => {
    const command = new Deno.Command("bin/ucm", {
      args: event.command.args,
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout: stdoutRaw, stderr: stderrRaw } = await command.output();
    return {
      id: event.id,
      result: {
        code,
        stdout: new TextDecoder().decode(stdoutRaw),
        stderr: new TextDecoder().decode(stderrRaw),
      }
    };
  })
).subscribe(outputLock);

export function commandToResult(): OperatorFunction<UcmCommand, UcmCommandResult> {
  return concatMap((command: UcmCommand) => {
    const id = crypto.randomUUID();
    const tempSubject = new BehaviorSubject<UcmCommandResult | null>(null);
    // TODO: differentiate between commands which can be parallelized and those which cannot
    // for now, we're treating all UCM commands as if they cannot be parallelized...
    // but commands which neither read from a shared codebase nor write to one could be parallelized,
    // eg strictly compiling to check for errors

    outputLock.pipe(
      filter((result: TrackedCommandResult) => result.id === id),
      map((result: TrackedCommandResult) => result.result),
      first(),
      finalize(() => tempSubject.complete()),
    ).subscribe(tempSubject);

    inputLock.next({ id, command });

    return tempSubject.pipe(
      filter(Boolean),
    );
  });
}

function commandResultToOutput(): OperatorFunction<UcmCommandResult, TranscriptOutput> {
  return mergeMap((result: UcmCommandResult) => {
    const match = result.stdout.match(/💾\s+Wrote\s+(\/\S+)/);
    if (match && match[1]) {
      return from(Deno.readTextFile(match[1])).pipe(
        tap(() => Deno.remove(match[1])),
        map<string, TranscriptOutput>((output: string) => ({ output }))
      );
    }

    return of({output: "", error: `Unable to detect output file!\n\nexit code: ${result.code}\n\nstderr: ${result.stderr}\n\nstdout: ${result.stdout}`})
  });
}

export function transcriptToOutput(argsFromTranscriptPath: (transcriptPath: string) => string[]): OperatorFunction<RenderedTranscript, TranscriptOutput> {
  return mergeMap((interpolatedCode: RenderedTranscript) => {
    const transcriptPath = `transcripts/template_${crypto.randomUUID()}.md`;
    const writePromise = Deno.writeTextFile(transcriptPath, interpolatedCode.transcript);

    return from(writePromise).pipe(
      map<void, UcmCommand>(() => ({ args: argsFromTranscriptPath(transcriptPath) })),
      commandToResult(),
      tap(() => Deno.remove(transcriptPath)),
      commandResultToOutput(),
    );
  });
}
