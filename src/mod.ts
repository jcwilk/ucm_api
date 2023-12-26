import { Application } from "./deps.ts";
import { versionRouter } from "./routes/version.ts";
import { compileRouter } from "./routes/compile.ts";
import { responseTime } from "./middlewares/responseTime.ts";
import { authenticate } from "./middlewares/authentication.ts";
import { cloneProject } from "./pipelines/cloning.ts";
import { firstValueFrom } from "./deps/rxjs.ts";

// TODO: put this project clone stuff somewhere else
const project = Deno.env.get("PROJECT");

if (project === undefined) {
  console.error("Error: PROJECT is not set.");
  Deno.exit(1); // Exits the program with a status code of 1 indicating failure
}

const cloneOutput = await firstValueFrom(cloneProject(project));
if (cloneOutput.error && cloneOutput.error.length > 0) {
  console.error("Project failed to clone!: "+cloneOutput.error);
  Deno.exit(1);
}

const app = new Application();
const port = 8000;

app.use(authenticate);

// A simple logger to show the method and URL of each request
app.use(async (context, next) => {
  await next();
  const rt = context.response.headers.get("X-Response-Time");
  console.log(`${context.request.method} ${context.request.url} - ${rt}`);
});

app.use(responseTime);

[versionRouter, compileRouter].forEach((router) => {
  app.use(router.routes());
  app.use(router.allowedMethods());
});

// Starting the server
console.log(`Server running on http://localhost:${port}/`);
await app.listen({ port });
