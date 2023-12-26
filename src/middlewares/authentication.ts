import { Context } from "../deps.ts";

export const authenticate = async (context: Context, next: () => Promise<unknown>) => {
  // Retrieve the Authorization header from the request
  const authHeader = context.request.headers.get("Authorization");

  // Extract the token from the Authorization header
  const token = authHeader?.split(' ')[1]; // Assuming "Bearer TOKEN"

  // Retrieve your API key stored securely
  const MASTER_API_KEY = Deno.env.get("MASTER_API_KEY"); // Set this in your environment variables

  // Proceed if the token is correct, else throw an error
  if (token === MASTER_API_KEY && token && token.length > 0) {
    await next();
  } else {
    context.response.status = 401; // Unauthorized
    context.response.body = { error: "Invalid API key" };
  }
};
