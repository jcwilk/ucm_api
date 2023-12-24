import { Router, Context } from "../deps.ts";
import { Eta } from "../deps.ts";

export const compileRouter = new Router();

// Define the middleware
async function handleTemplate(ctx: Context, next: () => Promise<unknown>) {
  const fileName = `templates/template_${crypto.randomUUID()}.md`;

  const code = ctx.request.url.searchParams.get("code") || "";
  const data = { code };

  const eta = new Eta({ autoEscape: false, views: Deno.cwd()+'/src/templates/' })

  const rendered = eta.render("compile", data);

  // Save to file (before section)
  await Deno.writeTextFile(fileName, rendered);
  ctx.state.templateFile = fileName;

  await next();

  // Delete file (after section)
  await Deno.remove(fileName);
}

async function runTranscriptAndFetchOutput(filePath: string): Promise<string> {
  const command = new Deno.Command("bin/ucm", {
    args: ["transcript", filePath],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();

  if (code === 0) {
    const output = new TextDecoder().decode(stdout);
    const match = output.match(/💾\s+Wrote\s+(\/\S+)/);
    if (match && match[1]) {
      return Deno.readTextFile(match[1]);
    }
    throw new Error("Output file path not found in transcript command output.");
  } else {
    const error = new TextDecoder().decode(stderr);
    throw new Error(`Command failed with exit code ${code}: ${error}`);
  }
}

// Apply middleware to a specific route
compileRouter.get("/compile", handleTemplate, async (context) => {
  // You can access the file path via context.state.templateFile
  context.response.body = await runTranscriptAndFetchOutput(context.state.templateFile);
});
