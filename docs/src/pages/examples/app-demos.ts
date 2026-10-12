/**
 * App examples: bigger programs that run in the modal full screen, with their
 * real source behind tabs (src/demos/apps/*, read by scripts/update-demo-sources.ts).
 */
import type { CodeFile } from "../../components/CodeBlock.ts";
import { APP_DEMO_SOURCES } from "../../generated/app-demo-sources.ts";
import { SortingStepper } from "../../demos/apps/sorting/app.ts";
import { KanbanBoard } from "../../demos/apps/kanban/app.ts";
import { ThreeInspector } from "../../demos/apps/three/app.ts";
import { InfiniteFeed } from "../../demos/apps/infinite-scroll/app.ts";

export interface AppExample {
  id: string;
  title: string;
  desc: string;
  code: string;
  files: CodeFile[];
  preview: () => NodeModLike<"div">;
  docs?: string;
  layout: "app";
}

function app(id: string, title: string, desc: string, preview: () => NodeModLike<"div">, docs?: string): AppExample {
  const files = APP_DEMO_SOURCES[id];
  return { id, title, desc, code: files[0].code, files, preview, docs, layout: "app" };
}

export const APP_EXAMPLES: AppExample[] = [
  app(
    "sorting",
    "Algorithm Stepper",
    "The engine is plain JavaScript: generators that mutate an array and yield after every step. The player calls `next()` and `update()`; the bars are a `list()` over the same objects, so a swap moves two elements.",
    SortingStepper,
    "api-list",
  ),
  app(
    "kanban",
    "Kanban Board",
    "Columns and cards are plain arrays of the same objects; every move is a `splice()`. Rows are matched by identity, so dragging or sorting inside a column reuses the elements. The mount count on screen proves it.",
    KanbanBoard,
    "api-list",
  ),
  app(
    "three",
    "three.js Inspector",
    "A library that owns its own state. The panel reads positions, colors and flags straight from the three.js objects and writes edits back to them. The render loop calls `update()` once per frame; nothing is mirrored.",
    ThreeInspector,
    "api-update",
  ),
  app(
    "infinite-scroll",
    "Infinite Scroll",
    "Pages from a fake `fetch()` land in one plain array with `push()`, so the rows on screen are never rebuilt. A sentinel row creates an IntersectionObserver in `on(\"mount\")`, returns its cleanup, and asks for the next page as it comes into view.",
    InfiniteFeed,
    "lifecycle",
  ),
];
