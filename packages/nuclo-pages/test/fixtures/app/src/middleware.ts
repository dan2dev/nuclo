import type { Middleware } from "nuclo-pages";

export default ((event, next) => {
  event.setHeaders({ "x-fixture": "1" });
  return next();
}) satisfies Middleware;
