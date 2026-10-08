import { createMarker, createMarkerPair } from "../shared/dom";
import {
  claimChild,
  claimMarkerPair,
  isHydrating,
  peekChild,
  runFreshAtCursor,
  setCursor,
  skipWhitespaceText,
} from "../hydration";
import type { RegionRuntime, ViewRuntime } from "./runtime";
import {
  attachViews,
  claimEmpty,
  decodeCount,
  liveRegionAt,
  reclaimEmpty,
  registerRegion,
  showEmpty,
} from "./runtime";

export { sweepRegions } from "./runtime";

function makeRuntime(
  options: RegionOptions,
  host: ExpandedElement<ElementTagName>,
  index: number,
  startMarker: Comment,
  endMarker: Comment,
): RegionRuntime<ElementTagName> {
  const empty = options.empty === undefined ? [] : [options.empty];
  return {
    id: options.id,
    type: options.type ?? "simple",
    empty,
    startMarker,
    endMarker,
    host,
    index,
    views: [],
    hidden: [],
    showingEmpty: false,
    claimCursor: null,
    claiming: false,
    deferred: null,
  };
}

function freshRegion(
  options: RegionOptions,
  host: ExpandedElement<ElementTagName>,
  index: number,
): Node {
  const { start, end } = createMarkerPair("region", index);
  const parent = host as unknown as Node & ParentNode;
  parent.appendChild(start);
  parent.appendChild(end);

  const runtime = makeRuntime(options, host, index, start, end);
  // `empty` first: registering drains the views that were waiting for this
  // id, and the first of them replaces it.
  showEmpty(runtime);
  registerRegion(runtime);
  return start;
}

function hydrateRegion(
  options: RegionOptions,
  host: ExpandedElement<ElementTagName>,
  index: number,
): Node {
  const parent = host as unknown as Node & ParentNode;

  // No region markers at the cursor (SSR output from something else): build
  // the region from scratch, as when() and list() do.
  const pair = claimMarkerPair(parent, "region");
  if (!pair) return runFreshAtCursor(parent, () => freshRegion(options, host, index));
  const { start, end } = pair;

  // The host carries on hydrating its own later children past the region. The
  // region's content is claimed through a cursor of its own, because the
  // view() that claims it runs somewhere else entirely in the tree.
  setCursor(parent, end.nextSibling);

  // A region already live on these markers — forceUpdate(), or hydrate() over
  // a tree that is live — keeps its runtime and its views: every view() that
  // re-runs in this pass reclaims its own content in place, so nothing here
  // can tell a view in another root from server leftovers and nothing is
  // swept. Only the options are taken fresh.
  const live = liveRegionAt(start, end);
  if (live) {
    live.type = options.type ?? "simple";
    live.empty = options.empty === undefined ? [] : [options.empty];
    live.host = host;
    live.index = index;
    if (live.showingEmpty) reclaimEmpty(live);
    return start;
  }

  const runtime = makeRuntime(options, host, index, start, end);
  if (pair.recreated) {
    showEmpty(runtime);
    registerRegion(runtime);
    return start;
  }

  runtime.claiming = true;
  runtime.claimCursor = start.nextSibling;
  // `-v0` means the server had no views either and what sits between the
  // markers is the `empty` content — claim it rather than rebuild it. Before
  // registering: the views waiting for this id replace it, as they would have
  // on the server had they existed there.
  if (decodeCount(start.textContent) === 0) claimEmpty(runtime);
  registerRegion(runtime);
  return start;
}

/**
 * Marks a named place in the tree for `view()` to fill.
 *
 * A region decouples *where* content appears from *who* builds it: the layout
 * says `region({ id: "main" })` and anything, at any depth, can put content
 * there with `view("main", …)` — no props threaded through every component in
 * between.
 *
 * `type` decides what happens when a region holds more than one view:
 * `"stack"` renders all of them, in arrival order, and `"simple"` (the
 * default) renders only the newest.
 *
 * Order does not matter: a view written before its region, or rendered into
 * a different root earlier, waits and shows up the moment the region is
 * built. A region that goes away (its when() closes) hands its views back to
 * waiting, so a region that returns under the same id shows them again.
 *
 * @example
 * ```ts
 * div(
 *   region({
 *     id: "main",
 *     type: "stack",
 *     empty: div("Nothing open."),
 *   }),
 * )
 *
 * // anywhere else, at any depth, before or after
 * view("main", h1("Hello from the main region"))
 * ```
 */
export function region(options: RegionOptions): NodeModFn {
  return function (host: ExpandedElement<ElementTagName>, index: number): Node {
    return isHydrating() ? hydrateRegion(options, host, index) : freshRegion(options, host, index);
  } as NodeModFn;
}

/** Claims the `<!--view-N-->` anchor the server left at the cursor, if any. */
function claimAnchor(parent: Node): Comment | null {
  skipWhitespaceText(parent);
  const next = peekChild(parent);
  if (!next || next.nodeType !== 8 || !next.textContent?.startsWith("view-")) return null;
  claimChild(parent);
  return next as Comment;
}

/**
 * Renders content into the `region()` with a matching id, wherever that region
 * sits in the tree.
 *
 * `view()` is a portal: where it is written it leaves only an anchor comment,
 * so a component can declare where its own output belongs instead of being
 * handed down to the right place. A page loaded by a router is the usual case
 * — it returns a `view()` and lands in the app's layout without the layout,
 * or the app, knowing anything about it.
 *
 * The content lives exactly as long as the view does: when the `when()` that
 * holds the view closes, or its `list()` row goes, the content leaves the
 * region too. A view whose region is not built yet waits for it.
 *
 * Pass one id, or an object to fill several regions at once. Either form
 * nests: a `view()` inside another view's content targets its own region.
 *
 * @example
 * ```ts
 * // one region
 * view("main", div(h1("Eager route")))
 *
 * // several at once
 * view({
 *   main: div(h1("Eager route")),
 *   sidebar: div("Related links"),
 * })
 * ```
 */
export function view(id: string, ...content: WhenContent[]): NodeModFn;
export function view(
  regions: Readonly<Record<string, WhenContent | readonly WhenContent[]>>,
): NodeModFn;
export function view(
  idOrRegions: string | Readonly<Record<string, unknown>>,
  ...content: WhenContent[]
): NodeModFn {
  const targets: Array<[string, readonly WhenContent<ElementTagName>[]]> =
    typeof idOrRegions === "string"
      ? [[idOrRegions, content]]
      : Object.entries(idOrRegions).map(([id, value]) => [
          id,
          (Array.isArray(value) ? value : [value]) as readonly WhenContent<ElementTagName>[],
        ]);

  return function (host: ExpandedElement<ElementTagName>, index: number): Node {
    const parent = host as unknown as Node & ParentNode;
    const anchor = (isHydrating() && claimAnchor(parent)) || createMarker(`view-${index}`);
    const views: ViewRuntime[] = targets.map(([id, items]) => ({
      id,
      content: items,
      anchor,
      region: null,
      pendingRef: null,
      first: null,
      last: null,
    }));
    attachViews(anchor, views);
    return anchor;
  } as NodeModFn;
}
