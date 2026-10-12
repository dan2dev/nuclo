/**
 * A reusable route *section*.
 *
 * Every key is relative to whichever parent declares it — `"/"` is the record
 * page itself, the rest are its children. This module has no idea what its
 * URLs will be: src/routes.ts declares the same object under two parents, and
 * both get the same loader objects, so one import() serves both.
 */
import type { RouteTable } from "nuclo-router";

export const recordSection = {
  // The record page is the section's layout: it renders whichever child is
  // active in its outlet(), and is never rebuilt when that child changes.
  "/": () => import("../pages/Record.ts"),
  "./preview": {
    "/": () => import("./Preview.ts"),
    // Nested one level further, so Preview stays mounted while raw shows.
    "./raw": () => import("./Raw.ts"),
  },
} satisfies RouteTable;
