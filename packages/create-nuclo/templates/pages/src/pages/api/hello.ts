import type { RequestHandler } from "nuclo-pages";

// API routes export HTTP methods and return a Response.
export const GET: RequestHandler = ({ url }) => Response.json({ hello: url.searchParams.get("name") ?? "world" });
