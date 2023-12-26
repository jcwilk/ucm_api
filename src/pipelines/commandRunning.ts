import { BehaviorSubject, OperatorFunction, Subject, concatMap, filter, finalize, first, map } from "../deps/rxjs.ts";

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
