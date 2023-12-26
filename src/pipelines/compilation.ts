import { Eta } from "../deps.ts";
import { of, map, Observable, OperatorFunction, from, mergeMap, tap } from "../deps/rxjs.ts";
import { UcmCommand, UcmCommandResult, commandToResult } from "./commandRunning.ts";

type InterpolatedCode = {
  code: string,
  transcript: string,
}

type TranscriptOutput = {
  output: string,
  error?: string,
}

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

function interpolateCode(template: string): OperatorFunction<string, InterpolatedCode> {
  return map((code: string) => {
    const data = { code };

    const eta = new Eta({ autoEscape: false, views: Deno.cwd()+'/src/templates/' })

    const transcript = eta.render(template, data);

    return { transcript, code };
  });
}

function commandResultToOutput(): OperatorFunction<UcmCommandResult, TranscriptOutput> {
  return mergeMap((result: UcmCommandResult) => {
    let error = result.stderr;
    if (result.code === 0) {
      const match = result.stdout.match(/💾\s+Wrote\s+(\/\S+)/);
      if (match && match[1]) {
        return from(Deno.readTextFile(match[1])).pipe(
          tap(() => Deno.remove(match[1])),
          map<string, TranscriptOutput>((output: string) => ({ output }))
        );
      }
      error = "Output file path not found in transcript command output: " + JSON.stringify(result.stdout);
    }

    return of({ error, output: "" } as TranscriptOutput);
  });
}

function transcriptToOutput(): OperatorFunction<InterpolatedCode, TranscriptOutput> {
  return mergeMap((interpolatedCode: InterpolatedCode) => {
    const transcriptPath = `templates/template_${crypto.randomUUID()}.md`;
    const writePromise = Deno.writeTextFile(transcriptPath, interpolatedCode.transcript);

    return from(writePromise).pipe(
      map<void, UcmCommand>(() => ({ args: ["transcript", transcriptPath] })),
      commandToResult(),
      tap(() => Deno.remove(transcriptPath)),
      commandResultToOutput(),
    );
  });
}

function parseTranscriptOutput(code: string): OperatorFunction<TranscriptOutput, CompilationResult> {
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
      const definitionsStartIndex = lines.findIndex(line => line.includes("⍟ I've added these definitions:"));

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
  return of(code).pipe(
    // interpolate code into a template and return the string
    interpolateCode("compile"),

    // run the transcript command on the string and return the output file contents, removing both files in the process
    transcriptToOutput(),

    // parse the output file contents and return the result
    parseTranscriptOutput(code),
  )
}
