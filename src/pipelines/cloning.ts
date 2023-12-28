import { Observable, of } from "../deps/rxjs.ts";
import { renderTranscriptTemplate } from "../utils/templateRendering.ts";
import { TranscriptOutput, transcriptToOutput } from "./commandRunning.ts";

export function cloneProject(project: string): Observable<TranscriptOutput> {
  const transcript = renderTranscriptTemplate("clone.md.eta", { project });

  return of(transcript).pipe(
    transcriptToOutput(transcriptPath => ["transcript", "-Scodebases/temp", transcriptPath]),
  );
}
