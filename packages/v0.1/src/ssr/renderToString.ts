/**
 * Server-Side Rendering (SSR) utilities for Nuclo
 * Renders Nuclo components to HTML strings in Node.js environment
 */

import { escapeHtml, escapeText, camelToKebab } from '../utility/stringUtils';
import { createElement } from '../utility/dom';

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

  if (name === 'style' && typeof value === 'object') {
    const styleStr = Object.entries(value)
      .filter(([, val]) => val != null && val !== '')
      .map(([key, val]) => `${camelToKebab(key)}: ${val};`)
      .join(' ');
    return styleStr ? ` style="${escapeHtml(styleStr)}"` : '';
  }

  return ` ${name}="${escapeHtml(String(value))}"`;
}

/**
 * Serializes DOM element attributes to HTML string
 */
function serializeAttributes(element: Element): string {
  let result = '';

  // Handle polyfill elements with Map-based attributes
  if ('attributes' in element && element.attributes instanceof Map) {
    const el = element as any;

    // id — may live on the property rather than in the Map
    if (el.id && !element.attributes.has('id')) {
      result += serializeAttribute('id', el.id);
    }

    // class — kept on .className, mirrored to Map only when setAttribute is used
    if (el.className && !element.attributes.has('class')) {
      result += serializeAttribute('class', el.className);
    }

    // style — lives on the Proxy, not in the attributes Map.
    // cssText returns camelCase keys ("backgroundColor: red"), so convert them.
    if (!element.attributes.has('style') && el.style) {
      const rawCssText: string = el.style.cssText || '';
      if (rawCssText) {
        const kebabStyle = rawCssText
          .split(';')
          .map((decl: string) => decl.trim())
          .filter(Boolean)
          .map((decl: string) => {
            const colonIdx = decl.indexOf(':');
            if (colonIdx === -1) return decl;
            const key = decl.slice(0, colonIdx).trim();
            const val = decl.slice(colonIdx + 1).trim();
            // Skip declarations with empty values (e.g. reactive styles that resolved to undefined)
            if (!val) return '';
            return `${camelToKebab(key)}: ${val};`;
          })
          .filter(Boolean)
          .join(' ');
        if (kebabStyle) {
          result += ` style="${escapeHtml(kebabStyle)}"`;
        }
      }
    }

    // All remaining attributes from the Map
    // Convert camelCase ARIA/HTML attribute names (e.g. ariaLabel → aria-label) that the
    // polyfill stores as-is because NucloElement lacks the browser property mappings.
    // SVG attributes that are natively camelCase (e.g. viewBox, preserveAspectRatio) must
    // NOT be converted — they are stored via setAttribute() as-is.
    for (const [name, value] of element.attributes) {
      const htmlName = SVG_PRESERVE_CASE_ATTRS.has(name) ? name : camelToKebab(name);
      result += serializeAttribute(htmlName, value);
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
 * Self-closing HTML tags that don't have closing tags
 */
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

/**
 * Get child nodes from a node (handles both browser and polyfill elements).
 *
 * NucloElement stores ALL children (elements, text, comments) in a plain Array
 * called `children` — it is the authoritative list.  DocumentFragments in the
 * polyfill also have a `children` array, but it only holds Element children;
 * their full set of nodes lives in `childNodes`.  We therefore only prefer
 * `children` when the node is an actual element (has `tagName`).
 */
function getChildNodes(node: Node): ArrayLike<Node> {
  // NucloElement: tagName exists and children is a plain Array containing every node type
  if ('tagName' in node && 'children' in node) {
    const children = (node as any).children;
    if (Array.isArray(children)) {
      return children as ArrayLike<Node>;
    }
  }
  // DocumentFragments and browser elements: use childNodes
  if ('childNodes' in node) {
    const childNodes = (node as any).childNodes;
    if (childNodes && (Array.isArray(childNodes) || childNodes.length !== undefined)) {
      return childNodes;
    }
  }
  return [] as ArrayLike<Node>;
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
    const tagName = element.tagName.toLowerCase();
    const attributes = serializeAttributes(element);

    // Self-closing tags
    if (VOID_ELEMENTS.has(tagName)) {
      return `<${tagName}${attributes} />`;
    }

    // Regular elements with children
    let childrenHtml = '';
    const childNodes = getChildNodes(element);
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
    const childNodes = getChildNodes(node);
    if (childNodes && childNodes.length > 0) {
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
      const container = createElement('div');
      if (!container) throw new Error('Document is not available. Make sure polyfills are loaded.');
      const element = input(container as ExpandedElement<ElementTagName>, 0);
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
