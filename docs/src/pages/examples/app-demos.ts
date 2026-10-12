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
import { Desktop } from "../../demos/apps/desktop/app.ts";
import { DataGrid } from "../../demos/apps/data-grid/app.ts";
import { ChatApp } from "../../demos/apps/chat/app.ts";
import { LiveDashboard } from "../../demos/apps/dashboard/app.ts";
import { PixelEditor } from "../../demos/apps/pixel-editor/app.ts";
import { SnakeGame } from "../../demos/apps/snake/app.ts";
import { StepSequencer } from "../../demos/apps/sequencer/app.ts";
import { LocaleShop } from "../../demos/apps/i18n/app.ts";
import { PageBuilder } from "../../demos/apps/page-builder/app.ts";
import { ThemeEditor } from "../../demos/apps/theme-editor/app.ts";

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
    "page-builder",
    "Page Builder",
    "Write directly on the page, drag grips to reorder blocks or move them into layouts, press / to insert, and right-click for actions. Style grid and flex layouts, undo edits, preview at phone size and export HTML.",
    PageBuilder,
    "api-list",
  ),
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
    "A feed with no end: a fast fake `fetch()` generates every page on the fly into one plain array. Only the rows near the viewport are in the DOM: the `list()` renders `posts.slice(start, end)` between two spacers, so the page stays light at a hundred thousand posts. A sentinel at the real end asks for the next page before it comes into view.",
    InfiniteFeed,
    "lifecycle",
  ),
  app(
    "desktop",
    "Desktop",
    "A working desktop with Files, Notes, Terminal, Calculator and Timer. Create and organize folders, edit notes, and use shell commands on one shared simulated disk saved in your browser. Windows keep their state as you move, resize and switch between apps; a running timer fills the taskbar tray with into().",
    Desktop,
    "api-region",
  ),
  app(
    "data-grid",
    "Data Grid",
    "A work table over 10,000 plain row objects. Search, filter, sort and paging are plain functions over the array, and the table body is a list() over the current page. Rows are matched by identity, so sorting moves the rows that stay on the page, and an edited row is the same object everywhere. The rows-built count proves it.",
    DataGrid,
    "api-list",
  ),
  app(
    "chat",
    "Chat",
    "A chat pinned to the bottom while its history loads upward forever. Every request is plain async/await with an update() before and after. Older pages go in with unshift() and the scroll position grows by the height they added, so nothing on screen jumps. Your message shows at once, and send() only changes fields on the same object, so its row is never rebuilt, even when it fails and you retry.",
    ChatApp,
    "async",
  ),
  app(
    "dashboard",
    "Live Dashboard",
    "Cards that refresh at different rates, from 20 times a second down to once a second. Each card is a scope(), and its timer calls update() with that card's id, so a tick evaluates only that card. Every dynamic value is counted on screen: switch to a plain update() and the clock is evaluated about a hundred times a second to change once.",
    LiveDashboard,
    "api-scope",
  ),
  app(
    "pixel-editor",
    "Pixel Editor",
    "The picture is one plain array of 1024 color strings, and each cell reads its color from it. A stroke writes into the array and calls update(); when it ends, the editor keeps a copy with slice(). Undo, redo and every step in the history list() put an older array back: no store, no immutable data.",
    PixelEditor,
    "explicit-updates",
  ),
  app(
    "snake",
    "Snake",
    "A game loop is a timer that calls step() on plain objects, then update() once per tick. The snake is a list() of its cell objects, and each tick the tail object becomes the new head, so one element moves and none is built: the segments-built count only goes up when the snake eats. Food pops in with a keyframes() animation.",
    SnakeGame,
    "events",
  ),
  app(
    "sequencer",
    "Step Sequencer",
    "A library that owns its own clock. Web Audio books every note ahead on its own timeline, and the pattern is a plain 2D array of booleans that the grid flips and the scheduler reads, so a click is heard on the next pass. The playhead updates only its scope() when the audible step changes. Audio starts on the first Play and closes in the mount cleanup, so leaving the example stops the sound.",
    StepSequencer,
    "lifecycle",
  ),
  app(
    "i18n",
    "Locale Switcher",
    "Every label is a static value, written as in a one-language app, so update() never reads it again: cart clicks refresh only quantities and totals. Switching the language calls forceUpdate() on this tree, which runs the component again and patches the same elements, lang and dir included. Money, plurals, dates and lists come from Intl, and the cart and a typed coupon survive the switch.",
    LocaleShop,
    "api-force-update",
  ),
  app(
    "theme-editor",
    "Theme Editor",
    "A small component library: createCss() names the tokens and variants() builds buttons, badges, cards, inputs, alerts and switches from them. The tokens are CSS variables, so every class compiles once. Each control writes a plain theme object and calls update(), which rewrites the text of one style element.",
    ThemeEditor,
    "api-variants",
  ),
];
