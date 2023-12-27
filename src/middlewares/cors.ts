import { Context } from "../deps.ts";

export const cors = async (context: Context, next: () => Promise<unknown>) => {
  const headers = context.response.headers;
  headers.set("Access-Control-Allow-Origin", "*"); // Allow all origins - change in production
  headers.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (context.request.method === "OPTIONS") {
    // Preflight request. Stop here and send response with headers.
    headers.set("Access-Control-Allow-Credentials", "true"); // If needed, adjust according to your requirements
    context.response.status = 200; // OK status
  } else {
    // Not a preflight request. Continue to other middlewares or routes.
    await next();
  }
};

