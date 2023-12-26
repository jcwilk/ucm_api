import { Observable, of } from "../deps/rxjs.ts";
import { renderTranscriptTemplate } from "../utils/templateRendering.ts";
import { TranscriptOutput, transcriptToOutput } from "./commandRunning.ts";

export function cloneProject(project: string): Observable<TranscriptOutput> {
  const transcript = renderTranscriptTemplate("clone.md", { project });

  return of(transcript).pipe(
    // run the transcript command on the string and return the output file contents, removing both files in the process
    transcriptToOutput(transcriptPath => ["transcript", "-Scodebases/temp", transcriptPath]),
  );
}
