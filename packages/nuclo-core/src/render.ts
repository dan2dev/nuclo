import { startHydration, endHydration, peekChild, setCursor, skipWhitespaceText } from "./hydration";
import { safeRemoveChild } from "./shared/dom";
import { flushMountQueue, mountQueueMark, cancelMountsSince } from "./element/lifecycle";
import { isFunction, isZeroArityFunction } from "./shared/type-guards";
import { isBrowser } from "./shared/environment";
import { logError } from "./shared/errors";

/**
 * A zero-arity component function. Rendering one (render(App) instead of
 * render(App())) lets a bare forceUpdate() re-invoke it later to rebuild the
 * tree with fresh static values.
 */
type Component<TTagName extends ElementTagName> = () => NodeModFn<TTagName>;

interface ForcedRoot {
  root: WeakRef<Element>;
  component: Component<ElementTagName>;
}

/**
 * Roots rendered/hydrated from a component function, so a bare forceUpdate()
 * can rebuild every one of them. Only a WeakRef to the root element is held;
 * disconnected roots are pruned on the next forceUpdate(). The entry itself
 * strongly holds the component closure, so — unlike the WeakRef-only
 * registries — a FinalizationRegistry drops the entry once its root is
 * collected: the closure (and whatever it captures) must not outlive the
 * app it renders, even if forceUpdate() is never called again.
 */
const forcedRoots: ForcedRoot[] = [];
const forcedRootFinalizer = typeof FinalizationRegistry !== "undefined"
  ? new FinalizationRegistry<ForcedRoot>((entry) => {
      const i = forcedRoots.indexOf(entry);
      if (i !== -1) forcedRoots.splice(i, 1);
    })
  : null;

/**
 * Distinguishes render(App, ...) — a zero-arity component returning a
 * NodeModFn — from render(App(), ...) — the NodeModFn itself (which always
 * declares (parent, index)). Anything else passes through unchanged.
 */
function unwrapComponent<TTagName extends ElementTagName>(
  fn: NodeModFn<TTagName> | Component<TTagName>,
): { build: NodeModFn<TTagName>; component: Component<TTagName> | null } {
  if (isZeroArityFunction(fn)) {
    const built = (fn as Component<TTagName>)();
    if (isFunction(built)) {
      return { build: built as NodeModFn<TTagName>, component: fn as Component<TTagName> };
    }
  }
  return { build: fn as NodeModFn<TTagName>, component: null };
}

function registerForcedRoot(element: unknown, component: Component<ElementTagName> | null): void {
  if (!component || !isBrowser) return;
  if (!element || (element as Node).nodeType !== 1) return;
  const entry: ForcedRoot = { root: new WeakRef(element as Element), component };
  forcedRoots.push(entry);
  forcedRootFinalizer?.register(element as Element, entry, entry);
}

/**
 * Renders a component to a parent element by calling it and appending the result.
 *
 * Pass the component function itself (not its result) to make the root
 * refreshable by a bare forceUpdate() call:
 *
 * ```ts
 * const App = () => div(h1("Hello"));
 * render(App, container);  // forceUpdate() can now rebuild this root
 * render(App(), container); // also valid — but invisible to forceUpdate()
 * ```
 *
 * @param nodeModFn A component function, or a built NodeModFn (div(), h1(), ...)
 * @param parent The parent element to render into (defaults to document.body)
 * @param index The index to pass to the NodeModFn (defaults to 0)
 * @returns The rendered element
 */
export function render<TTagName extends ElementTagName = ElementTagName>(
  nodeModFn: NodeModFn<TTagName> | (() => NodeModFn<TTagName>),
  parent?: Element,
  index: number = 0
): ExpandedElement<TTagName> {
  const { build, component } = unwrapComponent(nodeModFn);
  const targetParent = (parent || document.body) as ExpandedElement<TTagName>;
  const mark = mountQueueMark();
  let element: ExpandedElement<TTagName>;
  try {
    element = build(targetParent, index) as ExpandedElement<TTagName>;
    (targetParent as unknown as Node).appendChild(element as Node);
  } catch (error) {
    // The half-built tree is discarded: nothing in it may mount later.
    cancelMountsSince(mark);
    throw error;
  }
  // The whole tree was built off-document and just got attached in this one
  // call — every onMount queued while building it can fire now.
  flushMountQueue();
  registerForcedRoot(element, component as Component<ElementTagName> | null);
  return element;
}

/**
 * Hydrates an existing server-rendered DOM tree by walking it in parallel with
 * the component tree, reusing existing nodes and re-attaching reactivity.
 *
 * Instead of clearing the container and creating new DOM nodes (like render()),
 * hydrate() claims existing nodes from the SSR output and registers reactive
 * text nodes, attributes, event listeners, list runtimes, and when runtimes
 * on them.
 *
 * Like render(), passing the component function itself (hydrate(App, ...))
 * makes the root refreshable by a bare forceUpdate() call.
 *
 * @param nodeModFn A component function, or the NodeModFn used for SSR
 * @param parent The parent element containing the SSR HTML (defaults to document.body)
 * @returns The hydrated root element
 *
 * @example
 * ```ts
 * // Server: const html = renderToString(App());
 * // Client:
 * const app = document.getElementById("app")!;
 * // app.innerHTML already contains the SSR HTML
 * hydrate(App, app);
 * ```
 */
export function hydrate<TTagName extends ElementTagName = ElementTagName>(
  nodeModFn: NodeModFn<TTagName> | (() => NodeModFn<TTagName>),
  parent?: Element,
): ExpandedElement<TTagName> {
  const { build, component } = unwrapComponent(nodeModFn);
  const element = hydrateRoot(build, parent, false, null);
  registerForcedRoot(element, component as Component<ElementTagName> | null);
  return element;
}

/**
 * Re-evaluates every component-rendered root against its live DOM — including
 * static values that update() never touches (plain strings, numbers,
 * attribute literals captured when the tree was built):
 *
 * ```ts
 * const App = () => div(h1(labels[language].title), ...);
 * render(App, container);   // pass the component function, not App()
 * // later, after `language` changed:
 * forceUpdate();            // every such root is rebuilt in place
 * ```
 *
 * Existing DOM nodes are reused in place (same claim walk as hydrate()), so
 * element state — focus, input values, scroll — survives. Listeners, reactive
 * resolvers and class/inline-style state on reused elements are replaced by
 * the new build; lifecycle hooks on reused elements keep their original
 * registrations (onMount does not re-fire). Nodes the new tree no longer
 * produces are removed with full cleanup (onDestroy fires) — including
 * whitespace-only text inside the tree that sits where an element or block is
 * now expected (the container's own whitespace is never touched).
 *
 * Roots rendered from an already-built tree (render(App())) are not
 * registered — their static values were captured and cannot be re-evaluated.
 * The explicit form forceUpdate(App(), parent) force-rehydrates one tree
 * manually and returns its root element.
 *
 * Use update() for ordinary reactivity — forceUpdate() is for rare, sweeping
 * changes (e.g. switching the UI language).
 */
export function forceUpdate(): void;
export function forceUpdate<TTagName extends ElementTagName = ElementTagName>(
  nodeModFn: NodeModFn<TTagName> | (() => NodeModFn<TTagName>),
  parent?: Element,
): ExpandedElement<TTagName>;
export function forceUpdate<TTagName extends ElementTagName = ElementTagName>(
  nodeModFn?: NodeModFn<TTagName> | (() => NodeModFn<TTagName>),
  parent?: Element,
): ExpandedElement<TTagName> | void {
  if (nodeModFn !== undefined) {
    return hydrateRoot(unwrapComponent(nodeModFn).build, parent, true, null);
  }

  let write = 0;
  for (let read = 0; read < forcedRoots.length; read++) {
    const entry = forcedRoots[read];
    const root = entry.root.deref();
    const parentEl = root?.parentNode;
    // Collected, disconnected or reparented-out-of-an-element roots drop out.
    if (!root || !root.isConnected || !parentEl || parentEl.nodeType !== 1) {
      forcedRootFinalizer?.unregister(entry);
      continue;
    }
    try {
      const el = hydrateRoot(
        entry.component() as NodeModFn<ElementTagName>,
        parentEl as Element,
        true,
        root,
      );
      // The walk replaces the root only on a tag mismatch — track the new one.
      if ((el as unknown) !== root) {
        entry.root = new WeakRef(el as unknown as Element);
        forcedRootFinalizer?.unregister(entry);
        forcedRootFinalizer?.register(el as unknown as Element, entry, entry);
      }
    } catch (error) {
      logError("forceUpdate(): component threw; keeping this root's previous DOM", error);
    }
    forcedRoots[write++] = entry;
  }
  forcedRoots.length = write;
}

function hydrateRoot<TTagName extends ElementTagName>(
  nodeModFn: NodeModFn<TTagName>,
  parent: Element | undefined,
  force: boolean,
  at: Element | null,
): ExpandedElement<TTagName> {
  const targetParent = (parent || document.body) as ExpandedElement<TTagName>;
  const parentNode = targetParent as unknown as Node & ParentNode;
  startHydration(force);
  // A known root (bare forceUpdate()): pin the claim cursor to it so the walk
  // starts exactly there — foreign siblings in the parent are never touched.
  if (at) setCursor(parentNode, at);
  // The container belongs to the app, not to nuclo: step over its template
  // whitespace here so a force pass (which drops stale whitespace text inside
  // the tree it rebuilds) never removes it.
  else if (force) skipWhitespaceText(parentNode, false);
  const mark = mountQueueMark();
  let element: ExpandedElement<TTagName>;
  try {
    element = nodeModFn(targetParent, 0) as ExpandedElement<TTagName>;
    const elementNode = element as unknown as Node | null | undefined;
    // Claim failed (empty container or tag mismatch): the factory built a
    // fresh, detached root. Replace the mismatched SSR node at the cursor —
    // or append when there is nothing to replace — so the app is always live
    // in the document. Only the single candidate node is touched; siblings
    // (other roots, scripts) are preserved.
    if (elementNode && elementNode.nodeType === 1 && elementNode.parentNode !== parentNode) {
      const stale = peekChild(parentNode);
      if (stale) {
        const after = stale.nextSibling;
        parentNode.insertBefore(elementNode, stale);
        safeRemoveChild(stale);
        setCursor(parentNode, after);
      } else {
        parentNode.appendChild(elementNode);
        setCursor(parentNode, null);
      }
    }
  } catch (error) {
    // Fresh nodes of the half-built tree are discarded: they may not mount
    // later. Claimed nodes are live in the document and keep their turn.
    cancelMountsSince(mark);
    throw error;
  } finally {
    endHydration();
  }
  // Claimed nodes were already connected (they're existing SSR output inside
  // the live `parent`); freshly-built replacement nodes just got attached
  // above. Either way, by this point everything nodeModFn() touched is
  // settled in the document, so queued onMount callbacks can fire — but only
  // on this success path. Placed outside the try/finally on purpose: if
  // nodeModFn() throws, the tree it was building is incomplete/inconsistent,
  // so any mounts it had already queued are left Pending rather than fired.
  flushMountQueue();
  return element;
}
