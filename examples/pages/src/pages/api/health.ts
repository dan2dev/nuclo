import type { RequestHandler } from "nuclo-pages";

// An API route: export HTTP methods instead of a view.
export const GET: RequestHandler = () => Response.json({ ok: true, time: new Date().toISOString() });
