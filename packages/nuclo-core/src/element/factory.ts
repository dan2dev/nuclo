/**
 * Element creation: builds HTML/SVG elements and applies the modifier list
 * that was passed to a tag builder (children, attributes, text, on(), ...).
 */
import { applyNodeModifier, type NodeModifier } from "./modifiers";
import { SVG_NAMESPACE } from "../shared/dom";
import { claimElement, cleanupUnclaimedChildren } from "../hydration";
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

  for (let i = 0; i < modifiers.length; i += 1) {
    const mod = modifiers[i];
    // Fast null/undefined skip
    if (mod == null) continue;

    const produced = applyNodeModifier(element, mod, localIndex);
    if (!produced) continue;

    // Only append if the node isn't already where we expect
    if (produced.parentNode !== parentNode) {
      parentNode.appendChild(produced);
    }
    localIndex += 1;
  }
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
