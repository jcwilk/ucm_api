import { of, map, Observable } from "../deps/rxjs.ts";
import { renderTranscriptTemplate } from "../utils/templateRendering.ts";
import { TranscriptOutput, transcriptToOutput } from "./commandRunning.ts";

type DeleteResult = {
  definitionName: string,
  isType: boolean,
  transcriptOutput: TranscriptOutput,
}

export function deleteDefinitionAndPush(definitionName: string, isType: boolean): Observable<DeleteResult> {
  const transcript = renderTranscriptTemplate("deleteAndPush.md.eta", { definitionName, isType, project: Deno.env.get("PROJECT") || "" });

  return of(transcript).pipe(
    transcriptToOutput(transcriptPath => ["transcript.fork", "-Ccodebases/temp", "-Scodebases/temp", transcriptPath]),

    map((transcriptOutput: TranscriptOutput) => ({ definitionName, isType, transcriptOutput })),
  )
}
