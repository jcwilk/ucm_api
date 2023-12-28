import { of, map, Observable } from "../deps/rxjs.ts";
import { renderTranscriptTemplate } from "../utils/templateRendering.ts";
import { TranscriptOutput, transcriptToOutput } from "./commandRunning.ts";

type PushResult = {
  code: string,
  transcriptOutput: TranscriptOutput,
}

export function updateAndPushCode(code: string): Observable<PushResult> {
  const transcript = renderTranscriptTemplate("updateAndPush.md.eta", { code, project: Deno.env.get("PROJECT") || "" });

  return of(transcript).pipe(
    transcriptToOutput(transcriptPath => ["transcript.fork", "-Ccodebases/temp", "-Scodebases/temp", transcriptPath]),

    map((transcriptOutput: TranscriptOutput) => ({ code, transcriptOutput })),
  )
}
