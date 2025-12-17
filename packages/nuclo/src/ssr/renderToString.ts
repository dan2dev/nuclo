/**
 * Server-Side Rendering (SSR) utilities for Nuclo
 * Renders Nuclo components to HTML strings in Node.js environment
 */

import { escapeHtml, camelToKebab } from '../utility/stringUtils';
import { createElement } from '../utility/dom';

type RenderableInput =
  | NodeModFn<ElementTagName>
  | Element
  | Node
  | null
  | undefined;

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

  if (name === 'style' && typeof value === 'object') {
    const styleStr = Object.entries(value)
      .map(([key, val]) => {
        const cssKey = camelToKebab(key);
        return `${cssKey}:${val}`;
      })
      .join(';');
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
    // First, handle special properties that might not be in the attributes Map
    const el = element as any;

    // Add id if it exists and is not already in attributes
    if (el.id && !element.attributes.has('id')) {
      result += serializeAttribute('id', el.id);
    }

    // Add class if it exists and is not already in attributes
    if (el.className && !element.attributes.has('class')) {
      result += serializeAttribute('class', el.className);
    }

    // Then add all attributes from the Map
    for (const [name, value] of element.attributes) {
      result += serializeAttribute(name, value);
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
 * Get child nodes from an element (handles both browser and polyfill elements)
 */
function getChildNodes(node: Node): ArrayLike<Node> {
  // Check for childNodes first (document fragments and browser elements)
  if ('childNodes' in node) {
    const childNodes = (node as any).childNodes;
    if (childNodes && (Array.isArray(childNodes) || childNodes.length !== undefined)) {
      return childNodes;
    }
  }
  // Polyfill elements have children array
  if ('children' in node) {
    const children = (node as any).children;
    if (children && Array.isArray(children)) {
      return children as ArrayLike<Node>;
    }
  }
  return [] as ArrayLike<Node>;
}

/**
 * Serializes a DOM node to HTML string
 */
function serializeNode(node: Node): string {
  // Text node
  if (node.nodeType === 3) { // Node.TEXT_NODE
    return escapeHtml(node.textContent || '');
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
  if (!input) {
    return '';
  }

  // If it's a function (NodeModFn), call it to create the element
  if (typeof input === 'function') {
    try {
      // Create a temporary container to render into
      const container = createElement('div');
      if (!container) {
        throw new Error('Document is not available. Make sure polyfills are loaded.');
      }

      const element = input(container as ExpandedElement<ElementTagName>, 0);
      return element && typeof element === 'object' && 'nodeType' in element ? serializeNode(element as Node) : '';
    } catch (error) {
      console.error('Error rendering component to string:', error);
      return '';
    }
  }

  // If it's already a Node, serialize it directly
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
