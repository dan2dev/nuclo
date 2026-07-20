/**
 * Element creation: builds HTML/SVG elements and applies the modifier list
 * that was passed to a tag builder (children, attributes, text, on(), ...).
 */
import { applyNodeModifier, type NodeModifier } from "./modifiers";
import { createElement, createElementNS, SVG_NAMESPACE } from "../shared/dom";
import { claimElement, cleanupUnclaimedChildren } from "../hydration";
import { isMetadataOnlyFactoryMode, setFactoryMeta } from "./factory-meta";

export type { NodeModifier };

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
  if (!modifiers || modifiers.length === 0) return;

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
 * Creates an HTML element with the specified tag name and applies modifiers to it.
 */
export function createHtmlElementWithModifiers<TTagName extends ElementTagName>(
  tagName: TTagName,
  modifiers: ReadonlyArray<NodeModifier<TTagName>>
): ExpandedElement<TTagName> {
  const el = createElement(tagName) as ExpandedElement<TTagName>;
  applyModifiers(el, modifiers, 0);
  return el;
}

/**
 * Creates an SVG element with the specified tag name and applies modifiers to it.
 */
export function createSvgElementWithModifiers<TTagName extends keyof SVGElementTagNameMap>(
  tagName: TTagName,
  modifiers: ReadonlyArray<unknown>
): SVGElementTagNameMap[TTagName] {
  const el = createElementNS(SVG_NAMESPACE, tagName);
  if (!el) {
    throw new Error(`Failed to create SVG element: ${tagName}`);
  }
  applyModifiers(el as unknown as ExpandedElement<ElementTagName>, modifiers as ReadonlyArray<NodeModifier<ElementTagName>>, 0);
  return el as unknown as SVGElementTagNameMap[TTagName];
}


/**
 * Creates an HTML element factory with the given modifiers.
 */
function createHtmlElementFactory<TTagName extends ElementTagName>(
  tagName: TTagName,
  ...modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): DetachedExpandedElementFactory<TTagName> {
  if (isMetadataOnlyFactoryMode()) {
    const factory = function(): ExpandedElement<TTagName> {
      return null as unknown as ExpandedElement<TTagName>;
    } as DetachedExpandedElementFactory<TTagName>;
    setFactoryMeta(factory, tagName, modifiers);
    return factory;
  }

  const factory = function(_parent?: ExpandedElement<TTagName>, index = 0): ExpandedElement<TTagName> {
    const parentNode = _parent as unknown as Node | undefined;
    const claimed = parentNode ? claimElement(parentNode, tagName) as ExpandedElement<TTagName> | null : null;
    const el = claimed ?? createElement(tagName) as ExpandedElement<TTagName>;
    const elNode = el as unknown as Node;
    const lastOriginalChild = claimed ? elNode.lastChild : null;
    applyModifiers(el, modifiers as ReadonlyArray<NodeModifier<TTagName>>, index);
    if (claimed) {
      cleanupUnclaimedChildren(elNode, lastOriginalChild);
    }
    return el;
  } as DetachedExpandedElementFactory<TTagName>;
  // Lets the list() template engine see the factory's structure (internal
  // symbols — invisible to the public API).
  setFactoryMeta(factory, tagName, modifiers);
  return factory;
}

/**
 * Creates an SVG element factory with the given modifiers.
 */
function createSvgElementFactory<TTagName extends keyof SVGElementTagNameMap>(
  tagName: TTagName,
  ...modifiers: Array<unknown>
): DetachedSVGElementFactory<TTagName> {
  if (isMetadataOnlyFactoryMode()) {
    const factory = function(): SVGElementTagNameMap[TTagName] {
      return null as unknown as SVGElementTagNameMap[TTagName];
    } as DetachedSVGElementFactory<TTagName>;
    setFactoryMeta(factory, tagName, modifiers);
    return factory;
  }

  return function(_parent?, index = 0): SVGElementTagNameMap[TTagName] {
    const parentNode = _parent as unknown as Node | undefined;
    const claimed = parentNode ? claimElement(parentNode, tagName) as ExpandedElement | null : null;
    const el = claimed ?? createElementNS(SVG_NAMESPACE, tagName);
    if (!el) {
      throw new Error(`Failed to create SVG element: ${tagName}`);
    }
    const elNode = el as unknown as Node;
    const lastOriginalChild = claimed ? elNode.lastChild : null;
    applyModifiers(el as unknown as ExpandedElement<ElementTagName>, modifiers as ReadonlyArray<NodeModifier<ElementTagName>>, index);
    if (claimed) {
      cleanupUnclaimedChildren(elNode, lastOriginalChild);
    }
    return el as unknown as SVGElementTagNameMap[TTagName];
  } as DetachedSVGElementFactory<TTagName>;
}

/**
 * Creates an HTML tag builder function.
 */
export function createHtmlTagBuilder<TTagName extends ElementTagName>(
  tagName: TTagName,
): ExpandedElementBuilder<TTagName> {
  return (...mods) => createHtmlElementFactory(tagName, ...mods);
}

/**
 * Creates an SVG tag builder function.
 */
export function createSvgTagBuilder<TTagName extends keyof SVGElementTagNameMap>(
  tagName: TTagName,
): ExpandedSVGElementBuilder<TTagName> {
  return (...mods) => createSvgElementFactory(tagName, ...mods);
}
