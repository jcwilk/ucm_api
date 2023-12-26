import { of, map, Observable } from "../deps/rxjs.ts";
import { renderTranscriptTemplate } from "../utils/templateRendering.ts";
import { TranscriptOutput, transcriptToOutput } from "./commandRunning.ts";

type PushResult = {
  code: string,
  transcriptOutput: TranscriptOutput,
}

export function updateAndPushCode(code: string): Observable<PushResult> {
  const transcript = renderTranscriptTemplate("updateAndPush.md.eta", { code });

  return of(transcript).pipe(
    // run the transcript command on the string and return the output file contents, removing both files in the process
    transcriptToOutput(transcriptPath => ["transcript.forked", "-Ccodebases/temp", "-Scodebases/temp", transcriptPath]),

    // parse the output file contents and return the result
    map((transcriptOutput: TranscriptOutput) => ({ code, transcriptOutput})),
  )
}
