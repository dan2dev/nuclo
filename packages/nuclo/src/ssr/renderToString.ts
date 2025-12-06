/**
 * Server-Side Rendering (SSR) utilities for Nuclo
 * Renders Nuclo components to HTML strings in Node.js environment
 */

type RenderableInput =
  | NodeModFn<ElementTagName>
  | Element
  | Node
  | null
  | undefined;

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char] || char);
}

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
        const cssKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
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

  if (!element.attributes) return result;

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr && attr.name) {
      result += serializeAttribute(attr.name, attr.value);
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
    if (element.childNodes) {
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
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
    if (node.childNodes) {
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
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
      const container = globalThis.document?.createElement('div');
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
