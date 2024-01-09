import { of, map, Observable, OperatorFunction } from "../deps/rxjs.ts";
import { renderTranscriptTemplate } from "../utils/templateRendering.ts";
import { TranscriptOutput, transcriptToOutput } from "./commandRunning.ts";

type CompiledTerm = {
  name: string,
  type: string,
}

type CompiledType = {
  name: string,
  unique: boolean,
}

type CompilationResult = {
  code: string,
  terms: CompiledTerm[],
  types: CompiledType[],
  errors: string[]
}

function parseCompilationTranscriptOutput(code: string): OperatorFunction<TranscriptOutput, CompilationResult> {
  return map((transcriptOutput: TranscriptOutput) => {
    const { output, error: transcriptError } = transcriptOutput;

    const terms: CompiledTerm[] = [];
    const types: CompiledType[] = [];
    const errors: string[] = [];

    if (transcriptError) {
      errors.push(transcriptError);
    }

    // Split the output into lines for easier parsing
    const lines = output.split('\n');

    // Check if the output is an error
    const errorIndex = lines.findIndex(line => line.includes('🛑'));
    if (errorIndex !== -1) {
      // Aggregate all lines after '🛑' as the error message
      errors.push(lines.slice(errorIndex + 1).join('\n'));
    } else {
      // Process as successful compilation output
      const definitionsStartIndex = lines.findIndex(line => line.includes("⍟ These new definitions are ok to `add`:"));

      if (definitionsStartIndex !== -1) {
        // Iterate over each line after the definitions start
        for (let i = definitionsStartIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) { // make sure it's not an empty line
            // Check if line is a term or type definition
            const [name, type] = line.split(':').map(s => s.trim());
            if (line.startsWith("structural type") || line.startsWith("unique type")) {
              // It's a type
              types.push({
                name: line.replace(/(structural type|unique type)/, '').trim(), // remove the prefix
                unique: line.startsWith("unique type")
              });
            } else if (type) {
              // It's a term
              terms.push({ name, type });
            }
          }
        }
      }
    }

    return { code, terms, types, errors };
  });
}

export function compileCode(code: string): Observable<CompilationResult> {
  const transcript = renderTranscriptTemplate("compile.md.eta", { code, project: Deno.env.get("PROJECT") || "" });

  return of(transcript).pipe(
    transcriptToOutput(transcriptPath => ["transcript.fork", "-Ccodebases/temp", transcriptPath]),

    parseCompilationTranscriptOutput(code),
  )
}
