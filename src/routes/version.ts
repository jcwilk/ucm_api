import { Router } from "../deps.ts";

async function ucmVersionOutput(): Promise<string> {
  const command = new Deno.Command("bin/ucm", {
    args: ["version"],
    stdout: "piped",
  });
  const { code, stdout, stderr } = await command.output();

  if (code === 0) {
    return new TextDecoder().decode(stdout);
  } else {
    const error = new TextDecoder().decode(stderr);
    throw new Error(`Command failed with exit code ${code}: ${error}`);
  }
}

export const versionRouter = new Router();

versionRouter.get("/version", async (context) => {
  context.response.body = await ucmVersionOutput();
});
