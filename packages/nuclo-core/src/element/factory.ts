/**
 * Element creation: builds HTML/SVG elements and applies the modifier list
 * that was passed to a tag builder (children, attributes, text, on(), ...).
 */
import { applyNodeModifier, type NodeModifier } from "./modifiers";
import { SVG_NAMESPACE } from "../shared/dom";
import { claimElement, claimChild, cleanupUnclaimedChildren, isHydrating, isForceHydrating, peekChild, setCursor } from "../hydration";
import { removeAllListeners } from "./events";
import { resetClassNameTracking } from "./class-name";
import { cleanupReactiveElement } from "../update/registry";
import { acquireMetadataOnlyFactory, isMetadataOnlyFactoryMode, setFactoryMeta } from "./factory-meta";

/**
 * Applies modifiers to an element, appending newly produced Nodes while avoiding
 * duplicate DOM insertions (i.e. only appends if parentNode differs).
 *
 * `localIndex` advances once per appended child so each reactive/static text
 * modifier gets a unique `text-N` marker; it is internal bookkeeping only and
 * is not returned (no production caller consumed the previous result object).
 */
export function applyModifiers<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  modifiers: ReadonlyArray<NodeModifier<TTagName>>,
  startIndex = 0
): void {
  let localIndex = startIndex;
  const parentNode = element as unknown as Node & ParentNode;
  // Hoisted: constant for this frame — runWithoutHydration() only affects
  // nested calls, which hoist their own value.
  const hydrating = isHydrating();
  const force = isForceHydrating();

  for (let i = 0; i < modifiers.length; i += 1) {
    const mod = modifiers[i];
    // Fast null/undefined skip
    if (mod == null) continue;

    const produced = applyNodeModifier(element, mod, localIndex);
    if (!produced) continue;

    // Only append if the node isn't already where we expect
    if (produced.parentNode !== parentNode) {
      // hydrate()/forceUpdate(): a fresh node (nothing to claim, or a
      // structural mismatch) lands at the claim cursor, keeping sibling
      // order — a plain append would put it after the cursor, where a later
      // sibling's claim would reach it. insertBefore(x, null) === append.
      // The cursor is then pinned explicitly: with no entry, peekChild falls
      // back to firstChild, which the insertion may have just changed.
      if (hydrating) {
        const at = peekChild(parentNode);
        parentNode.insertBefore(produced, at);
        setCursor(parentNode, at);
      } else {
        parentNode.appendChild(produced);
      }
    } else if (force && peekChild(parentNode) === produced) {
      // A raw Node child that is already in place (same instance passed
      // again): claim it so cleanupUnclaimedChildren doesn't remove it.
      claimChild(parentNode);
    }
    localIndex += 1;
  }
}

/**
 * Clears state a claimed element carries from its previous build so
 * re-applying the current modifiers converges instead of accumulating.
 *
 * Every claim (hydrate() and forceUpdate()) rebuilds class state from scratch:
 * the existing class attribute is the output of className modifiers, and left
 * in place initReactiveClassName would capture it as static classes that a
 * dynamic className then adds to instead of replacing.
 *
 * forceUpdate() also detaches on() listeners (the re-applied modifiers
 * re-attach), drops reactive attribute resolvers (re-registered) and rebuilds
 * inline style. Attributes the new tree no longer sets keep their old values —
 * nuclo keeps no per-element attribute manifest to diff against.
 */
function resetReusedElement(el: Element, force: boolean): void {
  resetClassNameTracking(el as HTMLElement);
  el.removeAttribute("class");
  if (!force) return;
  removeAllListeners(el as HTMLElement);
  cleanupReactiveElement(el);
  el.removeAttribute("style");
}

/**
 * Creates an element factory for `tagName` with the given modifiers. SVG
 * factories create namespaced elements and stay opaque to the list() template
 * engine (no factory metadata outside metadata-only mode), so rows containing
 * SVG always build through the normal path.
 */
function createElementFactory(tagName: string, modifiers: ReadonlyArray<unknown>, svg: boolean): unknown {
  if (isMetadataOnlyFactoryMode()) {
    const stub = acquireMetadataOnlyFactory();
    setFactoryMeta(stub, tagName, modifiers);
    return stub;
  }

  const factory = function(parent?: Node, index = 0): Element {
    const claimed = parent ? claimElement(parent, tagName) : null;
    if (claimed) resetReusedElement(claimed, isForceHydrating());
    const el = claimed ?? (svg ? document.createElementNS(SVG_NAMESPACE, tagName) : document.createElement(tagName));
    const lastOriginalChild = claimed ? el.lastChild : null;
    applyModifiers(el as unknown as ExpandedElement, modifiers as ReadonlyArray<NodeModifier>, index);
    if (claimed) cleanupUnclaimedChildren(el, lastOriginalChild);
    return el;
  };
  // Lets the list() template engine see the factory's structure (internal
  // symbols — invisible to the public API).
  if (!svg) setFactoryMeta(factory, tagName, modifiers);
  return factory;
}

/**
 * Creates an HTML tag builder function.
 */
export function createHtmlTagBuilder<TTagName extends ElementTagName>(
  tagName: TTagName,
): ExpandedElementBuilder<TTagName> {
  return (...mods) => createElementFactory(tagName, mods, false) as DetachedExpandedElementFactory<TTagName>;
}

/**
 * Creates an SVG tag builder function.
 */
export function createSvgTagBuilder<TTagName extends keyof SVGElementTagNameMap>(
  tagName: TTagName,
): ExpandedSVGElementBuilder<TTagName> {
  return (...mods) => createElementFactory(tagName, mods, true) as DetachedSVGElementFactory<TTagName>;
}
