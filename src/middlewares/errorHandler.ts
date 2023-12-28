import { Context } from "../deps.ts";

export async function errorHandler(context: Context, next: () => Promise<unknown>) {
  try {
    await next();
  } catch (error) {
    console.error(error);

    context.response.status = 500;
    context.response.body = { error: "Internal Server Error" };
  }
};
