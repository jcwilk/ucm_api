// mod.ts
import { Application } from "./deps.ts";
import { versionRouter } from "./routes/version.ts";
import { compileRouter } from "./routes/compile.ts";
import { responseTime } from "./middlewares/responseTime.ts";

const app = new Application();
const port = 8000;

// A simple logger to show the method and URL of each request
app.use(async (context, next) => {
  await next();
  const rt = context.response.headers.get("X-Response-Time");
  console.log(`${context.request.method} ${context.request.url} - ${rt}`);
});

// Response time middleware
app.use(responseTime);

[versionRouter, compileRouter].forEach((router) => {
  app.use(router.routes());
  app.use(router.allowedMethods());
});

// Starting the server
console.log(`Server running on http://localhost:${port}/`);
await app.listen({ port });
