import { Router } from "../deps.ts";
import { Eta } from "../deps.ts";
import { of, map, Observable, OperatorFunction, concatMap, firstValueFrom } from "../deps/rxjs.ts";

export const compileRouter = new Router();

type InterpolatedCode = {
  code: string,
  transcript: string,
}

type TranscriptOutput = {
  code: string,
  output: string,
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

function transcriptToOutput(): OperatorFunction<InterpolatedCode, TranscriptOutput> {
  return concatMap(async (interpolatedCode: InterpolatedCode) => {
    const transcriptPath = `templates/template_${crypto.randomUUID()}.md`;
    await Deno.writeTextFile(transcriptPath, interpolatedCode.transcript);

    const command = new Deno.Command("bin/ucm", {
      args: ["transcript", transcriptPath],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await command.output();

    await Deno.remove(transcriptPath);

    if (code === 0) {
      const output = new TextDecoder().decode(stdout);
      const match = output.match(/💾\s+Wrote\s+(\/\S+)/);
      if (match && match[1]) {
        const output = await Deno.readTextFile(match[1]);
        await Deno.remove(match[1]);
        return { output, code: interpolatedCode.code };
      }
      throw new Error("Output file path not found in transcript command output.");
    } else {
      const error = new TextDecoder().decode(stderr);
      throw new Error(`Command failed with exit code ${code}: ${error}`);
    }
  });
}

function parseTranscriptOutput(): OperatorFunction<TranscriptOutput, CompilationResult> {
  return map((transcriptOutput: TranscriptOutput) => {
    const { code, output } = transcriptOutput;

    const terms: CompiledTerm[] = [];
    const types: CompiledType[] = [];
    const errors: string[] = [];

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

function compileCode(code: string): Observable<CompilationResult> {
  return of(code).pipe(
    // interpolate code into a template and return the string
    interpolateCode("compile"),

    // run the transcript command on the string and return the output file contents, removing both files in the process
    transcriptToOutput(),

    // parse the output file contents and return the result
    parseTranscriptOutput(),
  )
}

compileRouter.post("/compile", async (context) => {
  const { value } = context.request.body({ type: 'json' });
  const { code } = await value;

  // TODO: change this pipeline so that there's a global lock of sorts used so that only one compilation can happen at a time
  context.response.body = await firstValueFrom(compileCode(code));
});
