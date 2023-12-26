import { Router } from "../deps.ts";
import { firstValueFrom } from "../deps/rxjs.ts";
import { updateAndPushCode } from "../pipelines/updateAndPushing.ts";

export const pushRouter = new Router();

pushRouter.post("/push", async (context) => {
  const { value } = context.request.body({ type: 'json' });
  const { code } = await value;

  context.response.body = await firstValueFrom(updateAndPushCode(code));
});
