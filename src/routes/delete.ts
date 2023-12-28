import { Router } from "../deps.ts";
import { firstValueFrom } from "../deps/rxjs.ts";
import { deleteDefinitionAndPush } from "../pipelines/deleteAndPushing.ts";
import { z } from '../deps.ts';
import { parseOrError } from "../utils/parameterParsing.ts";

export const deleteRouter = new Router();

const DeleteDefinitionSchema = z.object({
  definitionName: z.string(),
  isType: z.boolean(),
});

deleteRouter.post("/delete", async (context) => {
  await parseOrError(DeleteDefinitionSchema, context, async ({ definitionName, isType }) => {
    context.response.body = await firstValueFrom(deleteDefinitionAndPush(definitionName, isType));
  });
});
