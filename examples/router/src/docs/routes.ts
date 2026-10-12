/**
 * The docs section as a nested table.
 *
 * `"/"` is the section's layout; the rest are its children, written relative
 * to it. The router keeps the layout mounted while the children change, so
 * everything in it — scroll position, a focused filter box, an open accordion
 * — survives a child navigation.
 *
 * In the app's table this whole section is one line:
 *     "/docs": docsSection
 */
import type { RouteTable } from "nuclo-router";

export const docsSection = {
  "/": () => import("./Shell.ts"),
  "./intro": () => import("./pages/Intro.ts"),
  // A param child, and a catch-all for the section's own 404.
  "./:topic": () => import("./pages/Topic.ts"),
  "./*rest": () => import("./pages/NotFound.ts"),
} satisfies RouteTable;

/** Where the section lives. Used to build its nav links. */
export const DOCS_BASE = "/docs";

/** The section's nav, written relative to DOCS_BASE. */
export const DOCS_NAV: ReadonlyArray<readonly [string, string]> = [
  ["/", "Index"],
  ["/intro", "Intro"],
  ["/hydration", "A :topic"],
  ["/a/deep/one", "Child 404"],
];
