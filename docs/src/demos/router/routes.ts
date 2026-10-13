// routes.ts: isomorphic, imported by the browser (and a server, with SSR)
import { createRouter } from "nuclo-router";
import { announce } from "./embed.ts";
import { refreshSidebar } from "./sidebar.ts";

export const router = createRouter(
  {
    "/": () => import("./pages/Home.ts"),
    // A nested table: Docs is the layout, a topic renders in its outlet().
    "/docs": {
      "/": () => import("./pages/Docs.ts"),
      "./:topic": () => import("./pages/Topic.ts"),
    },
    // Another nested table: Shop and its section both have load()s. They run
    // in parallel on a cold navigation; one router.pending covers the pair.
    "/shop": {
      "/": () => import("./pages/Shop.ts"),
      "./:section": () => import("./pages/Section.ts"),
    },
    "/blog/:slug": () => import("./pages/Post.ts"), // has a load()
    // The order opens ./customer as a layer. Nested, the layer's URL names the
    // page beneath it, so a reload or a fresh tab can put the stack back.
    "/orders/new": {
      "/": () => import("./pages/Order.ts"),
      "./customer": () => import("./pages/NewCustomer.ts"),
    },
    "*": () => import("./pages/NotFound.ts"),
  },
  {
    base: "/demos/router", // the app lives under this prefix
    onNavigate: (ctx, kind) => {
      announce(kind);
      // The sidebar has a router of its own, never started. Every navigation
      // hands it the new URL to resolve against its table and reload from.
      refreshSidebar(ctx.url);
    },
  },
);
