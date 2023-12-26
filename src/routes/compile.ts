import { Router } from "../deps.ts";
import { firstValueFrom } from "../deps/rxjs.ts";
import { compileCode } from "../pipelines/compilation.ts";

export const compileRouter = new Router();

compileRouter.post("/compile", async (context) => {
  const { value } = context.request.body({ type: 'json' });
  const { code } = await value;

  context.response.body = await firstValueFrom(compileCode(code));
});
