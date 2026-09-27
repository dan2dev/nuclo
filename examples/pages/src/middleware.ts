import type { Middleware } from "nuclo-pages";

// Runs before every page, API route and server function.
export default (async (event, next) => {
  const started = performance.now();
  const response = await next();
  event.setHeaders({ "server-timing": `app;dur=${(performance.now() - started).toFixed(1)}` });
  return response;
}) satisfies Middleware;
