import { Router } from "../deps.ts";
import { firstValueFrom } from "../deps/rxjs.ts";
import { compileCode } from "../pipelines/compilation.ts";
import { z } from '../deps.ts';
import { parseOrError } from "../utils/parameterParsing.ts";

export const compileRouter = new Router();

const CompileCodeSchema = z.object({
  code: z.string(),
});

compileRouter.post("/compile", async (context) => {
  await parseOrError(CompileCodeSchema, context, async ({ code }) => {
    context.response.body = await firstValueFrom(compileCode(code));
  });
});
