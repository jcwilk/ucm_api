import { Router } from "../deps.ts";
import { firstValueFrom } from "../deps/rxjs.ts";
import { updateAndPushCode } from "../pipelines/updateAndPushing.ts";
import { z } from '../deps.ts';
import { parseOrError } from "../utils/parameterParsing.ts";

export const pushRouter = new Router();

const UpdateCodeSchema = z.object({
  code: z.string(),
});

pushRouter.post("/push", async (context) => {
  await parseOrError(UpdateCodeSchema, context, async ({ code }) => {
    context.response.body = await firstValueFrom(updateAndPushCode(code));
  });
});
