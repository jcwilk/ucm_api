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


export default async (req: Request) => {
	const url = new URL(req.url);
  const fullPathString = url.pathname+url.search;

  if (fullPathString === "/api/main?q=ping") {
    return new Response(await scriptOutput());
  } else {
    return new Response("Not Found: "+fullPathString, { status: 404 });
  }
};
