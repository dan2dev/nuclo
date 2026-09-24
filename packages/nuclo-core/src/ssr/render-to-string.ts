/**
 * Server-Side Rendering (SSR) utilities for Nuclo
 * Renders Nuclo components to HTML strings in Node.js environment
 */

import { escapeHtml, escapeText, camelToKebab } from '../shared/strings';
import { runSerializing } from '../hydration';
import { NucloElement } from '../polyfill/Element';

type RenderableInput =
  | NodeModFn<ElementTagName>
  | Element
  | Node
  | null
  | undefined;

/**
 * SVG attributes that are natively camelCase and must NOT be converted to kebab-case.
 * Most SVG attributes are already kebab-case (stroke-width, fill-rule, etc.), but a
 * handful are defined as camelCase in the SVG spec and must be preserved.
 */
const SVG_PRESERVE_CASE_ATTRS = new Set([
  'viewBox', 'preserveAspectRatio', 'markerWidth', 'markerHeight',
  'gradientTransform', 'patternTransform', 'clipPathUnits', 'gradientUnits',
  'patternUnits', 'pathLength', 'refX', 'refY', 'stdDeviation',
  'baseFrequency', 'numOctaves', 'kernelMatrix', 'tableValues',
  'targetX', 'targetY', 'specularExponent', 'specularConstant',
  'diffuseConstant', 'surfaceScale', 'xChannelSelector', 'yChannelSelector',
  'edgeMode', 'stitchTiles', 'spreadMethod', 'patternContentUnits',
  'markerUnits', 'startOffset', 'textLength', 'lengthAdjust',
]);

/**
 * HTML boolean attributes — presence means true, absence means false.
 * When the stored value is the string "true" or "false" (from setAttribute),
 * we must re-apply boolean semantics instead of outputting the raw string.
 */
const HTML_BOOLEAN_ATTRIBUTES = new Set([
  'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
  'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'ismap', 'loop',
  'multiple', 'muted', 'nomodule', 'novalidate', 'open', 'readonly', 'required',
  'reversed', 'selected',
]);

/**
 * Serializes a DOM attribute value
 */
function serializeAttribute(name: string, value: unknown): string {
  if (value === null || value === undefined || value === false) {
    return '';
  }

  if (value === true) {
    return ` ${name}`;
  }

  // Boolean attributes stored as strings via setAttribute() need special handling
  if (HTML_BOOLEAN_ATTRIBUTES.has(name)) {
    if (value === 'false') return '';
    if (value === 'true' || value === '' || value === name) return ` ${name}`;
  }

  // A style object (e.g. renderToStringWithContainer's containerAttrs from
  // untyped JS): serialize its declarations, skipping nullish/empty values.
  if (name === 'style' && typeof value === 'object') {
    let styleStr = '';
    for (const key in value as Record<string, unknown>) {
      const val = (value as Record<string, unknown>)[key];
      if (val == null || val === '') continue;
      styleStr += (styleStr ? ' ' : '') + camelToKebab(key) + ': ' + String(val) + ';';
    }
    return styleStr ? ` style="${escapeHtml(styleStr)}"` : '';
  }

  return ` ${name}="${escapeHtml(String(value))}"`;
}

/**
 * Serializes DOM element attributes to HTML string
 *
 * `isPolyfill` is passed in by the caller (serializeNode already computed it
 * to decide whether tagName needs lowercasing) so this doesn't repeat the
 * same `Array.isArray` discriminator check per element.
 */
function serializeAttributes(element: Element, isPolyfill: boolean): string {
  let result = '';

  // Handle polyfill elements. NucloElement keeps every child in a plain Array
  // (`children`), which a real DOM element never does (HTMLCollection) — this is
  // the same allocation-free discriminator serializeNode() uses. Reading
  // `el.attributes` directly would lazily allocate an empty Map for every
  // element being serialized, so the backing `_attributes` field is read instead.
  if (isPolyfill) {
    const el = element as any;
    const attrs = el._attributes as Map<string, string> | undefined;

    // id — may live on the property rather than in the Map
    if (el.id && !attrs?.has('id')) {
      result += serializeAttribute('id', el.id);
    }

    // class — kept on .className, mirrored to Map only when setAttribute is used
    if (el.className && !attrs?.has('class')) {
      result += serializeAttribute('class', el.className);
    }

    // style — lives on the backing _style object (its own properties are the
    // declarations), not in the attributes Map. Read the field directly (never
    // `el.style`) so elements that never set a style are not forced to lazily
    // allocate an empty SSRStyle just to serialize. Empty values (e.g. reactive
    // styles that resolved to undefined) are skipped.
    const styleObj = el._style as Record<string, unknown> | undefined;
    if (styleObj && !attrs?.has('style')) {
      let css = '';
      for (const key in styleObj) {
        const val = styleObj[key];
        if (val == null || val === '') continue;
        css += (css ? ' ' : '') + camelToKebab(key) + ': ' + String(val) + ';';
      }
      if (css) result += ` style="${escapeHtml(css)}"`;
    }

    // All remaining attributes from the Map
    // Convert camelCase ARIA/HTML attribute names (e.g. ariaLabel → aria-label) that the
    // polyfill stores as-is because NucloElement lacks the browser property mappings.
    // SVG attributes that are natively camelCase (e.g. viewBox, preserveAspectRatio) must
    // NOT be converted — they are stored via setAttribute() as-is.
    if (attrs) {
      for (const [name, value] of attrs) {
        const htmlName = SVG_PRESERVE_CASE_ATTRS.has(name) ? name : camelToKebab(name);
        result += serializeAttribute(htmlName, value);
      }
    }
    return result;
  }

  // Handle browser elements with NamedNodeMap attributes
  if (element.attributes && element.attributes.length) {
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr && attr.name) {
        result += serializeAttribute(attr.name, attr.value);
      }
    }
  }

  return result;
}

/**
 * Tag-category lookup, keyed by lowercase tag name. Every element in a tree
 * hits this once, so void + raw-text elements are folded into a single
 * dictionary lookup instead of two separate `Set.has()` probes (one of which
 * would always miss for the other category).
 */
const TAG_VOID = 1;
const TAG_RAW_TEXT = 2;
const TAG_CATEGORY: Record<string, 1 | 2> = Object.assign(Object.create(null), {
  // Self-closing HTML tags that don't have closing tags
  area: TAG_VOID, base: TAG_VOID, br: TAG_VOID, col: TAG_VOID, embed: TAG_VOID,
  hr: TAG_VOID, img: TAG_VOID, input: TAG_VOID, link: TAG_VOID, meta: TAG_VOID,
  param: TAG_VOID, source: TAG_VOID, track: TAG_VOID, wbr: TAG_VOID,
  // Raw-text elements — browsers never decode entities inside them, so their
  // text content must be emitted verbatim (escaping would corrupt inline
  // JS/CSS, e.g. `a < b` becoming `a &lt; b` inside a script). A closing-tag
  // sequence in the content would terminate the element early, so it is
  // neutralized (see escapeRawText).
  script: TAG_RAW_TEXT, style: TAG_RAW_TEXT,
});

function escapeRawText(tagName: string, text: string): string {
  // "</script" (any case) inside a script would close it — break the sequence
  // the same way JSON serializers do ("<\/script").
  return text.replace(new RegExp('</(' + tagName + ')', 'gi'), '<\\/$1');
}

/**
 * Serializes a DOM node to HTML string
 */
function serializeNode(node: Node): string {
  // Text node — only & < > need escaping; quotes are safe in text content
  if (node.nodeType === 3) { // Node.TEXT_NODE
    return escapeText(node.textContent || '');
  }

  // Comment node
  if (node.nodeType === 8) { // Node.COMMENT_NODE
    return `<!--${node.textContent || ''}-->`;
  }

  // Element node
  if (node.nodeType === 1) { // Node.ELEMENT_NODE
    const element = node as Element;
    const rawTagName = element.tagName;
    // Duck-typed polyfill discriminator (also used by serializeAttributes): a
    // plain Array `children` field never occurs on a real
    // DOM element (HTMLCollection), only on NucloElement — and on hand-rolled
    // polyfill-shaped test doubles, which is why this alone isn't enough to
    // skip re-lowercasing tagName below.
    const isPolyfillShape = Array.isArray((element as any).children);
    // Only a *real* NucloElement is guaranteed to have pre-lowercased tagName
    // (done once in its constructor) — re-lowercasing it here on every
    // element would be pure waste, since this is the hottest function in
    // renderToString. Anything else (browser Element, or a polyfill-shaped
    // object that didn't go through `new NucloElement()`) still needs it.
    const tagName = element instanceof NucloElement ? rawTagName : rawTagName.toLowerCase();
    const attributes = serializeAttributes(element, isPolyfillShape);
    const category = TAG_CATEGORY[tagName];

    // Self-closing tags
    if (category === TAG_VOID) {
      return `<${tagName}${attributes} />`;
    }

    const childNodes: ArrayLike<Node> = isPolyfillShape ? (element as any).children : element.childNodes;

    // Raw-text elements: emit text verbatim (no entity escaping, no Nuclo
    // text markers — `<!--` would act as a line comment inside a script).
    if (category === TAG_RAW_TEXT) {
      let rawContent = '';
      const rawChildren = childNodes;
      if (rawChildren && rawChildren.length > 0) {
        for (let i = 0; i < rawChildren.length; i++) {
          const child = rawChildren[i];
          if (child && child.nodeType === 3) {
            rawContent += child.textContent || '';
          }
        }
      } else {
        const tc = (node as { textContent?: unknown }).textContent;
        if (typeof tc === 'string') rawContent = tc;
      }
      return `<${tagName}${attributes}>${escapeRawText(tagName, rawContent)}</${tagName}>`;
    }

    // Regular elements with children
    let childrenHtml = '';
    if (childNodes && childNodes.length > 0) {
      for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        if (child) {
          childrenHtml += serializeNode(child);
        }
      }
    } else {
      // Fallback: textContent set directly on the element (e.g. el.textContent = "...")
      const tc = (node as any).textContent;
      if (typeof tc === 'string' && tc) {
        childrenHtml = escapeText(tc);
      }
    }

    return `<${tagName}${attributes}>${childrenHtml}</${tagName}>`;
  }

  // Document fragment
  if (node.nodeType === 11) { // Node.DOCUMENT_FRAGMENT_NODE
    let result = '';
    const childNodes: ArrayLike<Node> = (node as any).childNodes ?? [];
    if (childNodes.length > 0) {
      for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        if (child) {
          result += serializeNode(child);
        }
      }
    }
    return result;
  }

  return '';
}

/**
 * Renders a Nuclo component to an HTML string for server-side rendering
 *
 * @param input - A Nuclo component function, DOM element, or node
 * @returns HTML string representation of the component
 *
 * @example
 * ```ts
 * import { renderToString } from 'nuclo/ssr';
 * import { div } from 'nuclo';
 *
 * const html = renderToString(
 *   div("Hello, World!")
 * );
 * // Returns: '<div>Hello, World!</div>'
 * ```
 */
export function renderToString(input: RenderableInput): string {
  if (!input) return '';

  if (typeof input === 'function') {
    try {
      // Build the tree in serialization mode so text children keep their
      // <!-- text-N --> markers (needed for hydration) even when isBrowser is
      // true, e.g. SSR running under jsdom.
      const element = runSerializing(() => {
        if (typeof document === 'undefined') throw new Error('Document is not available. Make sure polyfills are loaded.');
        return input(document.createElement('div') as unknown as ExpandedElement<ElementTagName>, 0);
      });
      return element && typeof element === 'object' && 'nodeType' in element ? serializeNode(element as Node) : '';
    } catch (error) {
      console.error('Error rendering component to string:', error);
      return '';
    }
  }

  if ('nodeType' in input) {
    return serializeNode(input as Node);
  }

  return '';
}

/**
 * Renders multiple Nuclo components to HTML strings
 *
 * @param inputs - Array of Nuclo components
 * @returns Array of HTML strings
 */
export function renderManyToString(inputs: RenderableInput[]): string[] {
  return inputs.map(input => renderToString(input));
}

/**
 * Renders a Nuclo component and wraps it in a container element
 *
 * @param input - A Nuclo component
 * @param containerTag - The tag name for the container (default: 'div')
 * @param containerAttrs - Attributes for the container element
 * @returns HTML string with container wrapper
 */
export function renderToStringWithContainer(
  input: RenderableInput,
  containerTag: string = 'div',
  containerAttrs: Record<string, string> = {}
): string {
  const content = renderToString(input);
  const attrs = Object.entries(containerAttrs)
    .map(([key, value]) => serializeAttribute(key, value))
    .join('');

  return `<${containerTag}${attrs}>${content}</${containerTag}>`;
}
