// routes.ts: isomorphic, imported by the browser (and a server, with SSR)
import { createRouter } from "nuclo-router";
import { announce } from "./embed.ts";

export const router = createRouter(
  {
    "/": () => import("./pages/Home.ts"),
    // A nested table: Docs is the layout, a topic renders in its outlet().
    "/docs": {
      "/": () => import("./pages/Docs.ts"),
      "./:topic": () => import("./pages/Topic.ts"),
    },
    "/blog/:slug": () => import("./pages/Post.ts"), // has a load()
    "/orders/new": () => import("./pages/Order.ts"), // opens a layer
    "/customers/new": () => import("./pages/NewCustomer.ts"),
    "*": () => import("./pages/NotFound.ts"),
  },
  {
    base: "/demos/router", // the app lives under this prefix
    onNavigate: (_ctx, kind) => announce(kind),
  },
);
