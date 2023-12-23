import { serve } from "./deps.ts";

async function scriptOutput() {
  const process = Deno.run({
    cmd: [`./scripts/echo.sh`],
    stdout: "piped",
  });

  const decoder = new TextDecoder();

  const output = await process.output()
  const parsed = decoder.decode(output);

  return parsed;
}

async function ucmVersionOutput() {
  const process = Deno.run({
    cmd: [`./bin/ucm`, `version`],
    stdout: "piped",
  });

  const decoder = new TextDecoder();

  const output = await process.output()
  const parsed = decoder.decode(output);

  return parsed;
}

const port = 8000;

const handler = async (request: Request): Promise<Response> => {
  switch (new URL(request.url).pathname) {
    case "/ping":
      return new Response("pong");
    case "/ucm":
      return new Response(await ucmVersionOutput());
    case "/echo":
      return new Response(await scriptOutput());
    default:
      return new Response("Not found", { status: 404 });
  }
};

console.log(`Server running on http://localhost:${port}/`);
await serve(handler, { port });
