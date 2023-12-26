import { Router } from "../deps.ts";
import { firstValueFrom } from "../deps/rxjs.ts";
import { compileCode } from "../pipelines/compilation.ts";

export const compileRouter = new Router();

compileRouter.post("/compile", async (context) => {
  const { value } = context.request.body({ type: 'json' });
  const { code } = await value;

  // TODO: change this pipeline so that there's a global lock of sorts used so that only one compilation can happen at a time
  context.response.body = await firstValueFrom(compileCode(code));
});
