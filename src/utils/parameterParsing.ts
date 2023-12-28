import { Context, z } from "../deps.ts";

export async function parseOrError<T>(schema: z.Schema<T>, context: Context, onParsed: (data: T) => Promise<void>): Promise<void> {
  const parsed = schema.safeParse(await context.request.body().value);

  if (!parsed.success) {
    context.response.status = 400;
    context.response.body = { error: parsed.error.flatten() };
    return;
  }

  await onParsed(parsed.data);
}
