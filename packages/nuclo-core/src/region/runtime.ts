import { clearBetweenMarkers, safeRemoveChild } from "../shared/dom";
import { renderContentItems } from "../when/runtime";
import { isHydrating, peekChild, setCursor } from "../hydration";
import { isSerializing, serializingScratch } from "../shared/serializing";
import { applyModifiers } from "../element/factory";
import { isMounted, setNodeDisposer } from "../element/lifecycle";
import type { NodeModifier } from "../element/modifiers";

/**
 * One view() placement. A view is a portal: its content lives between its
 * region's markers, and the view itself is a single `<!--view-N-->` anchor
 * comment standing where it was written. The anchor is what ties the content
 * to the view's own lifetime — when nuclo removes the anchor (its when()
 * closes, its list() row goes, its tree is replaced), the content leaves the
 * region with it, and a view whose region has not been built yet waits for
 * as long as its anchor is in the tree.
 */
export interface ViewRuntime {
  id: string;
  content: readonly WhenContent<ElementTagName>[];
  anchor: Comment;
  /** The region showing this view; null while it waits for one. */
  region: RegionRuntime<ElementTagName> | null;
  /** Its entry in the waiting list, while it waits. */
  pendingRef: WeakRef<Comment> | null;
  /**
   * First and last top-level node of its content between the region's
   * markers, both null when the content produced nothing. Top-level nodes are
   * stable: a nested list()/when() only ever changes what sits between its own
   * markers, so the range stays correct until the region or the view drops it.
   */
  first: Node | null;
  last: Node | null;
}

/**
 * A region is a named place in the tree; `view()` calls fill it from anywhere
 * else, in any order. The region owns a marker pair and every view's content
 * is inserted between them.
 */
export interface RegionRuntime<TTagName extends ElementTagName = ElementTagName> {
  id: string;
  type: RegionType;
  empty: readonly WhenContent<TTagName>[];
  startMarker: Comment;
  endMarker: Comment;
  host: ExpandedElement<TTagName>;
  index: number;
  /** The views it shows, in arrival order — one at most for "simple". */
  views: ViewRuntime[];
  /**
   * "simple" only: the views a newer one replaced, oldest first. They keep
   * their place so the one underneath shows again — rebuilt — when the view
   * on top leaves, which is what lets a layer open over a page in a simple
   * region and close without taking the page with it.
   */
  hidden: ViewRuntime[];
  /** True while the `empty` content occupies the markers. */
  showingEmpty: boolean;
  /**
   * Server markup between the markers that no view() has claimed yet, and the
   * cursor to claim it from. Null outside a hydration pass. The region's own
   * host cursor is parked past the end marker as usual — the host keeps
   * hydrating its later children — so claiming swaps this one in and out.
   */
  claimCursor: Node | null;
  claiming: boolean;
  /**
   * Views that arrived while one was being placed — a view's content placing
   * another view into the same region. Placed once the first is done, in
   * order, so neither's node range swallows the other's.
   */
  deferred: Array<[ViewRuntime, ViewRuntime | null]> | null;
}

/**
 * Regions are addressed by id, which has to survive until a view() looks it
 * up, but must not keep a detached layout alive. Same shape as the when()
 * registry: the id map holds only a WeakRef to the start marker (which the DOM
 * holds strongly while it is in the tree) and the runtime hangs off it in a
 * WeakMap, so dropping the subtree drops the runtime, its host and its
 * content. Views waiting for a region are kept the same way, by a WeakRef to
 * their anchor.
 *
 * This registry belongs to one page. On a server the same module scope serves
 * every request and every user at once, so a server tree never touches it —
 * it gets one that lives and dies with the one renderToString() call, which
 * is also the only window in which its regions can be looked up.
 */
interface Registry {
  /** region id → start marker of the live region. */
  regions: Map<string, WeakRef<Comment>>;
  /** region id → anchors of the views waiting for it, in arrival order. */
  pending: Map<string, Set<WeakRef<Comment>>>;
}

const page: Registry = { regions: new Map(), pending: new Map() };
const runtimeByMarker = new WeakMap<Comment, RegionRuntime<ElementTagName>>();
const viewsByAnchor = new WeakMap<Comment, ViewRuntime[]>();

const SSR_KEY = "region.registry";

/** The registry for whoever is asking: this page, or this request. */
function registry(): Registry {
  if (!isSerializing()) return page;
  const scratch = serializingScratch();
  let reg = scratch.get(SSR_KEY) as Registry | undefined;
  if (!reg) scratch.set(SSR_KEY, (reg = { regions: new Map(), pending: new Map() }));
  return reg;
}

/**
 * Prunes the page registry once a marker is collected — the case nuclo never
 * saw the removal (a container's innerHTML wiped). A region's entry goes by
 * id; a waiting view's entry is unregistered as soon as it is placed or its
 * anchor is removed, so only the wiped ones ever reach the callback.
 */
const markerFinalizer = typeof FinalizationRegistry !== "undefined"
  ? new FinalizationRegistry<{ id: string; ref: WeakRef<Comment>; waiting: boolean }>(({ id, ref, waiting }) => {
      if (waiting) forgetPending(page, id, ref);
      else if (page.regions.get(id) === ref) page.regions.delete(id);
    })
  : null;

/** Regions holding unclaimed server markup, swept when the pass ends. */
const claimingRegions: Array<RegionRuntime<ElementTagName>> = [];

/**
 * A marker nuclo once attached that is no longer in the document: its tree
 * was dropped behind nuclo's back (a container's innerHTML wiped), so nothing
 * disposed it. Until it is collected it would still answer lookups — a region
 * would take views meant for its replacement, and a view would render stale
 * content into a region built later. A marker that was never attached is a
 * tree still being built, which is detached by design. The same test every
 * other registry applies on update().
 */
function dropped(marker: Comment): boolean {
  return isMounted(marker) && !marker.isConnected;
}

/** Unregisters a region; its views go back to waiting for the next one with this id. */
function dropRegion(rt: RegionRuntime<ElementTagName>): void {
  runtimeByMarker.delete(rt.startMarker);
  const reg = registry();
  if (reg.regions.get(rt.id)?.deref() === rt.startMarker) reg.regions.delete(rt.id);
  const shown = [...rt.hidden, ...rt.views];
  rt.hidden.length = 0;
  rt.views.length = 0;
  for (const view of shown) {
    detach(view);
    // A view whose own tree was wiped along with the region has no one left
    // to wait for.
    if (!dropped(view.anchor)) pendView(view);
  }
}

/**
 * update()'s pass over the registry: a region or a view (waiting or shown) in
 * a tree that left the document behind nuclo's back is let go of now rather
 * than on its next lookup, so a live view does not keep a wiped layout alive,
 * and a wiped view neither stays in a live region nor waits for one.
 */
export function pruneRegions(): void {
  const reg = registry();
  for (const [id, waiting] of reg.pending) {
    for (const ref of waiting) {
      const anchor = ref.deref();
      if (anchor && !dropped(anchor)) continue;
      waiting.delete(ref);
      if (!isSerializing()) markerFinalizer?.unregister(ref);
      const view = anchor && viewsByAnchor.get(anchor)?.find((v) => v.pendingRef === ref);
      if (view) view.pendingRef = null;
    }
    if (waiting.size === 0) reg.pending.delete(id);
  }
  for (const [id, ref] of reg.regions) {
    const marker = ref.deref();
    if (!marker) {
      reg.regions.delete(id);
      continue;
    }
    const rt = runtimeByMarker.get(marker);
    if (!rt) continue;
    if (dropped(marker)) {
      dropRegion(rt);
      continue;
    }
    for (const view of [...rt.hidden, ...rt.views]) if (dropped(view.anchor)) removeView(view);
  }
}

export function registerRegion<TTagName extends ElementTagName>(runtime: RegionRuntime<TTagName>): void {
  const rt = runtime as unknown as RegionRuntime<ElementTagName>;
  const reg = registry();
  const previous = reg.regions.get(rt.id)?.deref();
  // Two regions answering to the same id are fighting over the same views:
  // whichever registered last wins and the other stays empty forever. Only a
  // region already in the document is caught here — two written side by side
  // in one tree are both detached until render() inserts them, and nothing
  // distinguishes that from the ordinary case of a replaced tree re-using its
  // id.
  if (previous && previous !== rt.startMarker && previous.isConnected) {
    console.warn(
      `nuclo: two regions share the id "${rt.id}". Every view("${rt.id}", …) now ` +
        "goes to the one built last; the other stays empty. Give each region its own id.",
    );
  } else if (previous && previous !== rt.startMarker && dropped(previous)) {
    // The id is being re-used by the replacement of a wiped tree: views that
    // were showing in the old region (from trees still alive) come over.
    const old = runtimeByMarker.get(previous);
    if (old) dropRegion(old);
  }
  const known = runtimeByMarker.has(rt.startMarker);
  const ref = new WeakRef(rt.startMarker);
  reg.regions.set(rt.id, ref);
  runtimeByMarker.set(rt.startMarker, rt);
  // The finalizer prunes the page-lifetime map only; the request-scoped one is
  // dropped wholesale when the render ends. A marker re-registered by a later
  // pass is already on the finalizer's books.
  if (!known && !isSerializing()) markerFinalizer?.register(rt.startMarker, { id: rt.id, ref, waiting: false });
  setNodeDisposer(rt.startMarker, onMarkerDisposed);
  if (rt.claiming) claimingRegions.push(rt);
  // The region takes the views that were waiting for it, in the order they
  // arrived.
  const waiting = reg.pending.get(rt.id);
  if (!waiting) return;
  reg.pending.delete(rt.id);
  for (const anchorRef of waiting) {
    if (!isSerializing()) markerFinalizer?.unregister(anchorRef);
    const view = waitingView(anchorRef, rt.id);
    if (!view) continue;
    view.pendingRef = null;
    addView(rt, view, null);
  }
}

/**
 * True for the anchor comment a view() left where it was written. list()
 * accepts one as a row, which is what lets a page place itself: the row is
 * the anchor, and the row leaving the list takes the content out of the region.
 */
export function isViewAnchor(node: Node): boolean {
  return node.nodeType === 8 && viewsByAnchor.has(node as Comment);
}

/** The live region registered under an id, if one is still in the tree. */
export function getRegion(id: string): RegionRuntime<ElementTagName> | undefined {
  const reg = registry();
  const marker = reg.regions.get(id)?.deref();
  if (!marker) {
    reg.regions.delete(id);
    return undefined;
  }
  const rt = runtimeByMarker.get(marker);
  if (rt && dropped(marker)) {
    dropRegion(rt);
    return undefined;
  }
  return rt;
}

/**
 * The region already live on a claimed marker pair — a forceUpdate() pass, or
 * hydrate() over a tree that is live already. Its runtime and views are kept;
 * each view() re-running in the pass then reclaims its own content in place.
 */
export function liveRegionAt(start: Comment, end: Comment): RegionRuntime<ElementTagName> | undefined {
  const rt = runtimeByMarker.get(start);
  return rt && rt.endMarker === end ? rt : undefined;
}

/** How many views are waiting for a region with this id (for tests). */
export function pendingViewCount(id: string): number {
  return registry().pending.get(id)?.size ?? 0;
}

/** The still-waiting view behind a pending entry, or nothing once its anchor is gone or it was placed. */
function waitingView(ref: WeakRef<Comment>, id: string): ViewRuntime | undefined {
  const anchor = ref.deref();
  if (!anchor || dropped(anchor)) return undefined;
  return viewsByAnchor.get(anchor)?.find((v) => v.id === id && v.region === null);
}

function forgetPending(reg: Registry, id: string, ref: WeakRef<Comment>): void {
  const waiting = reg.pending.get(id);
  if (!waiting) return;
  waiting.delete(ref);
  if (waiting.size === 0) reg.pending.delete(id);
}

/** Queues a view for a region that does not exist yet. */
function pendView(view: ViewRuntime): void {
  if (view.pendingRef) return;
  const reg = registry();
  let waiting = reg.pending.get(view.id);
  if (!waiting) reg.pending.set(view.id, (waiting = new Set()));
  const ref = new WeakRef(view.anchor);
  view.pendingRef = ref;
  waiting.add(ref);
  // The ref is its own unregister token: one registration per entry.
  if (!isSerializing()) markerFinalizer?.register(view.anchor, { id: view.id, ref, waiting: true }, ref);
}

/** Takes a view off the waiting list. */
function unpend(view: ViewRuntime): void {
  const ref = view.pendingRef;
  if (!ref) return;
  view.pendingRef = null;
  forgetPending(registry(), view.id, ref);
  if (!isSerializing()) markerFinalizer?.unregister(ref);
}

/**
 * Ties the views written at one anchor to it and places each in its region —
 * or, for a region not built yet, leaves it waiting. During hydration the
 * anchor may be one claimed from a live tree, whose earlier views are then
 * replaced: a view still shown by its region reclaims that content in place,
 * and one still waiting keeps its place in the waiting list.
 */
export function attachViews(anchor: Comment, views: ViewRuntime[]): void {
  const earlier = viewsByAnchor.get(anchor);
  viewsByAnchor.set(anchor, views);
  setNodeDisposer(anchor, onMarkerDisposed);
  for (const view of views) {
    const before = earlier?.find((v) => v.id === view.id) ?? null;
    if (before) {
      view.pendingRef = before.pendingRef;
      before.pendingRef = null;
    }
    const rt = getRegion(view.id);
    if (rt) {
      unpend(view);
      addView(rt, view, before);
    } else {
      pendView(view);
    }
  }
}

/** `region-start-{index}-v{views}`, so hydration knows what the server left. */
function stamp(rt: RegionRuntime<ElementTagName>): void {
  rt.startMarker.textContent = `region-start-${rt.index}-v${rt.views.length}`;
}

/** Reads the view count out of an SSR start marker. */
export function decodeCount(markerText: string | null): number {
  const match = /-v(\d+)$/.exec(markerText || "");
  return match ? parseInt(match[1], 10) : 0;
}

function detach(view: ViewRuntime): void {
  view.region = null;
  view.first = null;
  view.last = null;
}

/** Records which nodes a view just produced: everything between `before` and `stop`. */
function setRange(view: ViewRuntime, before: Node, stop: Node): void {
  const first = before.nextSibling;
  view.first = first === stop ? null : first;
  view.last = view.first ? stop.previousSibling : null;
}

/** Puts the region back to its `empty` content, replacing whatever it holds. */
export function showEmpty<TTagName extends ElementTagName>(runtime: RegionRuntime<TTagName>): void {
  const rt = runtime as unknown as RegionRuntime<ElementTagName>;
  clearBetweenMarkers(rt.startMarker, rt.endMarker);
  for (const view of rt.views) detach(view);
  for (const view of rt.hidden) detach(view);
  rt.views.length = 0;
  rt.hidden.length = 0;
  rt.showingEmpty = true;
  if (rt.empty.length) renderContentItems(rt.empty, rt.host, rt.index, rt.endMarker);
  stamp(rt);
}

/**
 * Adds one view()'s content to a region.
 *
 * "stack" keeps every view, bottom first — the view that arrives second opens
 * over the first without touching it, so the content underneath keeps its DOM,
 * its focus and its form state. "simple" keeps only the newest.
 *
 * `earlier` is the view this one replaces on the same anchor (a hydration pass
 * re-running a live tree): if the region still shows it, the new view takes
 * over its place and claims its nodes.
 */
function addView(
  rt: RegionRuntime<ElementTagName>,
  view: ViewRuntime,
  earlier: ViewRuntime | null,
): void {
  // Arrived from inside the content being placed right now: its turn comes
  // once that content is complete, so the two node ranges stay separate.
  if (rt.deferred) {
    rt.deferred.push([view, earlier]);
    return;
  }
  rt.deferred = [];
  try {
    placeView(rt, view, earlier);
  } finally {
    const next = rt.deferred;
    rt.deferred = null;
    for (const [v, e] of next) addView(rt, v, e);
  }
}

function placeView(rt: RegionRuntime<ElementTagName>, view: ViewRuntime, earlier: ViewRuntime | null): void {
  if (earlier && earlier.region === rt) {
    // A view underneath a newer one keeps its place there, still unseen.
    const h = rt.hidden.indexOf(earlier);
    if (h !== -1) {
      rt.hidden[h] = view;
      earlier.region = null;
      view.region = rt;
      return;
    }
    reclaimView(rt, view, earlier);
    return;
  }
  if (rt.showingEmpty || (rt.type === "simple" && rt.views.length > 0)) {
    // Clearing throws away the server markup along with everything else, so it
    // also ends any claim in progress: the rest of this region renders fresh.
    clearBetweenMarkers(rt.startMarker, rt.endMarker);
    // A simple region shows only the newest, but the one it replaces is not
    // gone: it comes back when the newer view leaves.
    for (const old of rt.views) {
      old.first = null;
      old.last = null;
      rt.hidden.push(old);
    }
    rt.views.length = 0;
    rt.showingEmpty = false;
    rt.claiming = false;
    rt.claimCursor = null;
  }
  rt.views.push(view);
  view.region = rt;
  if (isHydrating() && rt.claiming) {
    const { before, cursor } = claimAt(rt, view.content);
    setRange(view, before, cursor);
  } else {
    // A view built fresh while the region is still claiming (a when() branch
    // the server did not render) goes in ahead of the unclaimed server
    // markup, or the sweep would take it for leftovers.
    const at = rt.claiming && rt.claimCursor ? rt.claimCursor : rt.endMarker;
    const before = at.previousSibling!;
    renderContentItems(view.content, rt.host, rt.index, at);
    setRange(view, before, at);
  }
  stamp(rt);
}

/**
 * Claims the region's unclaimed server markup for `content`, advancing the
 * claim cursor past it. Nothing is removed: what follows may belong to a view
 * that has not run yet, so leftovers are judged by the sweep.
 *
 * applyModifiers rather than a bare render: a node the content could not claim
 * is inserted at the claim cursor instead of dropped, exactly as when() does
 * for a branch it is re-running over SSR output.
 */
function claimAt(
  rt: RegionRuntime<ElementTagName>,
  content: readonly WhenContent<ElementTagName>[],
): { before: Node; cursor: Node } {
  const parent = rt.host as unknown as Node;
  const hostCursor = peekChild(parent);
  const from = rt.claimCursor ?? rt.endMarker;
  const before = from.previousSibling!;
  setCursor(parent, from);
  for (const item of content) applyModifiers(rt.host, [item as NodeModifier<ElementTagName>], rt.index);
  const cursor = peekChild(parent) ?? rt.endMarker;
  rt.claimCursor = cursor;
  setCursor(parent, hostCursor);
  return { before, cursor };
}

/**
 * Re-runs `content` over the nodes from `from` up to `stop` (exclusive),
 * claiming what matches and dropping the rest. Returns the node before the
 * range, for setRange().
 */
function claimRange(
  rt: RegionRuntime<ElementTagName>,
  content: readonly WhenContent<ElementTagName>[],
  from: Node,
  stop: Node,
): Node {
  const parent = rt.host as unknown as Node;
  const hostCursor = peekChild(parent);
  const before = from.previousSibling!;
  setCursor(parent, from);
  for (const item of content) applyModifiers(rt.host, [item as NodeModifier<ElementTagName>], rt.index);
  let leftover = peekChild(parent);
  while (leftover && leftover !== stop) {
    const next: Node | null = leftover.nextSibling;
    safeRemoveChild(leftover);
    leftover = next;
  }
  setCursor(parent, hostCursor);
  return before;
}

/** The node right after a view's content: the next view's first node, or the end marker. */
function boundaryAfter(rt: RegionRuntime<ElementTagName>, view: ViewRuntime): Node {
  if (view.last) return view.last.nextSibling ?? rt.endMarker;
  for (let i = rt.views.indexOf(view) + 1; i < rt.views.length; i++) {
    const first = rt.views[i].first;
    if (first) return first;
  }
  return rt.endMarker;
}

/** A view re-running over its own earlier content takes its place and claims its nodes. */
function reclaimView(rt: RegionRuntime<ElementTagName>, view: ViewRuntime, earlier: ViewRuntime): void {
  const stop = boundaryAfter(rt, earlier);
  const before = claimRange(rt, view.content, earlier.first ?? stop, stop);
  rt.views[rt.views.indexOf(earlier)] = view;
  detach(earlier);
  view.region = rt;
  setRange(view, before, stop);
  stamp(rt);
}

/**
 * Claims the server's `empty` content in place, for a region that had no views
 * on either side. Leaves the region claiming, so the sweep still drops
 * anything the empty content did not account for.
 */
export function claimEmpty<TTagName extends ElementTagName>(runtime: RegionRuntime<TTagName>): void {
  const rt = runtime as unknown as RegionRuntime<ElementTagName>;
  if (rt.empty.length) claimAt(rt, rt.empty);
  rt.showingEmpty = true;
}

/** Re-claims a live region's `empty` content in place (a pass re-running a live tree). */
export function reclaimEmpty(rt: RegionRuntime<ElementTagName>): void {
  claimRange(rt, rt.empty, rt.startMarker.nextSibling ?? rt.endMarker, rt.endMarker);
}

/** Takes a view's content out of its region; the region falls back to `empty` when none is left. */
function removeView(view: ViewRuntime): void {
  unpend(view);
  const rt = view.region;
  if (!rt) return;
  const h = rt.hidden.indexOf(view);
  if (h !== -1) {
    rt.hidden.splice(h, 1);
    detach(view);
    return;
  }
  const i = rt.views.indexOf(view);
  if (i !== -1) {
    rt.views.splice(i, 1);
    const stop = view.last ? view.last.nextSibling : null;
    let node = view.first;
    while (node && node !== stop) {
      const next: Node | null = node.nextSibling;
      safeRemoveChild(node);
      node = next;
    }
  }
  detach(view);
  if (i === -1) return;
  if (rt.views.length > 0 || rt.claiming) {
    // Mid-hydration the sweep decides, once it knows which views stayed.
    stamp(rt);
    return;
  }
  // The view underneath shows again, rebuilt; with none left, `empty` does.
  const underneath = rt.hidden.pop();
  if (underneath) addView(rt, underneath, null);
  else showEmpty(rt);
}

/**
 * nuclo removed a marker node of ours. A view's anchor takes its content out
 * of the region. A region's start marker unregisters the region and puts its
 * views back to waiting, in order, so a region that returns under the same id
 * (a layout switched off and on) shows them again.
 */
function onMarkerDisposed(node: Node): void {
  const anchor = node as Comment;
  const views = viewsByAnchor.get(anchor);
  if (views) {
    viewsByAnchor.delete(anchor);
    for (const view of views) removeView(view);
    return;
  }
  const rt = runtimeByMarker.get(anchor);
  if (rt) dropRegion(rt);
}

/**
 * Drops server markup no view() claimed, once the hydration pass is over.
 *
 * Nothing announces "this region has all its views now" mid-pass, so the
 * leftovers can only be judged at the end: a client that renders fewer views
 * than the server did leaves the tail of the region unclaimed.
 */
export function sweepRegions(): void {
  for (const rt of claimingRegions) {
    // A region torn down mid-pass (inside a when() branch the client did not
    // keep) is no longer the one under its marker; nothing of it is settled.
    if (rt.claiming && runtimeByMarker.get(rt.startMarker) === rt) {
      let leftover = rt.claimCursor;
      while (leftover && leftover !== rt.endMarker) {
        const next: Node | null = leftover.nextSibling;
        safeRemoveChild(leftover);
        leftover = next;
      }
      // A region the client left with no views at all falls back to `empty`.
      if (rt.views.length === 0 && !rt.showingEmpty) showEmpty(rt);
    }
    rt.claiming = false;
    rt.claimCursor = null;
  }
  claimingRegions.length = 0;
}
