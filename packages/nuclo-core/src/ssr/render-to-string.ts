/**
 * Server-Side Rendering (SSR) utilities for Nuclo
 * Renders Nuclo components to HTML strings in Node.js environment
 */

import { escapeHtml, escapeText, camelToKebab, propertyToAttribute } from '../shared/strings';
import { runSerializing } from '../shared/serializing';
import { runRootHooks } from '../shared/root-hooks';
import { isZeroArityFunction } from '../shared/type-guards';
import { SVG_NAMESPACE } from '../shared/dom';

type RenderableInput =
  | NodeModFn<ElementTagName>
  | (() => NodeModFn<ElementTagName>)
  | Element
  | Node
  | null
  | undefined;

/**
 * HTML boolean attributes — presence means true, absence means false.
 * When the stored value is the string "true" or "false" (from setAttribute),
 * we must re-apply boolean semantics instead of outputting the raw string.
 */
const HTML_BOOLEAN_ATTRIBUTES = new Set([
  'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
  'default', 'defer', 'disabled', 'disablepictureinpicture',
  'disableremoteplayback', 'formnovalidate', 'hidden', 'inert', 'ismap',
  'itemscope', 'loop', 'multiple', 'muted', 'nomodule', 'novalidate', 'open',
  'playsinline', 'readonly', 'required', 'reversed', 'selected',
]);

/** The fields of the SSR polyfill's NucloElement that the serializer reads. */
interface PolyfillElementShape {
  id?: string;
  className?: string;
  namespaceURI?: string;
  children?: ArrayLike<Node>;
  _attributes?: Map<string, string>;
  _style?: Record<string, unknown>;
}

/**
 * Characters that cannot appear in an HTML attribute name. A name containing
 * one would end the attribute — or the tag — early and let the rest be parsed
 * as markup (`{ 'x><script>…': '' }`), so such attributes are dropped. The
 * browser refuses them too: setAttribute() throws on these names. Only names
 * that come from the app's own objects are checked — a real element's
 * attributes were validated by the DOM, and id/class/style are fixed.
 */
const UNSAFE_ATTRIBUTE_NAME = /[\s"'<>\/=\u0000-\u001f\u007f]/;

/**
 * IDL property name → HTML attribute name, or '' for a name that must not be
 * emitted. The same few names repeat on every element, so both the mapping
 * and the safety check are paid once per distinct name. Bounded, so
 * attacker-chosen names cannot grow it without limit.
 */
const htmlAttributeNames = new Map<string, string>();
function htmlAttributeName(name: string): string {
  let mapped = htmlAttributeNames.get(name);
  if (mapped === undefined) {
    mapped = UNSAFE_ATTRIBUTE_NAME.test(name) ? '' : propertyToAttribute(name);
    if (htmlAttributeNames.size < 1024) htmlAttributeNames.set(name, mapped);
  }
  return mapped;
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
function serializeAttributes(element: Element, isPolyfill: boolean, valueIsContent: boolean): string {
  let result = '';

  // Handle polyfill elements. NucloElement keeps every child in a plain Array
  // (`children`), which a real DOM element never does (HTMLCollection) — this is
  // the same allocation-free discriminator serializeNode() uses. Reading
  // `el.attributes` directly would lazily allocate an empty Map for every
  // element being serialized, so the backing `_attributes` field is read instead.
  if (isPolyfill) {
    const el = element as unknown as PolyfillElementShape;
    const attrs = el._attributes;

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
    const styleObj = el._style;
    if (styleObj && !attrs?.has('style')) {
      let css = '';
      for (const key in styleObj) {
        const val = styleObj[key];
        if (val == null || val === '') continue;
        css += (css ? ' ' : '') + camelToKebab(key) + ': ' + String(val) + ';';
      }
      if (css) result += ` style="${escapeHtml(css)}"`;
    }

    // All remaining attributes from the Map. HTML elements: a camelCase key
    // (tabIndex, htmlFor, ariaDescribedBy) is an IDL property name that a real
    // element would have reflected to its content attribute (tabindex, for,
    // aria-describedby) — NucloElement has no such properties, so the key was
    // stored verbatim and is mapped here. SVG elements: browsers keep
    // setAttribute() names as-is (viewBox, preserveAspectRatio), so do we.
    if (attrs) {
      const svg = el.namespaceURI === SVG_NAMESPACE;
      for (const [name, value] of attrs) {
        // Rendered as the element's content, not as attributes — see serializeNode().
        if (name === 'innerHTML' || (valueIsContent && name === 'value')) continue;
        const attribute = htmlAttributeName(name);
        if (attribute === '') continue;
        result += serializeAttribute(svg ? name : attribute, value);
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
const TAG_RCDATA = 3;
const TAG_SELECT = 4;
const TAG_OPTION = 5;
const TAG_OPTGROUP = 6;
type TagCategory = 1 | 2 | 3 | 4 | 5 | 6;
const TAG_CATEGORY: Record<string, TagCategory> = Object.assign(Object.create(null), {
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
  // Escapable raw-text elements — entities are decoded but markup is not
  // parsed, so a `<!-- text-N -->` marker would show up literally (in the
  // page title, in a textarea's value). Text only, escaped.
  title: TAG_RCDATA, textarea: TAG_RCDATA,
  // A select's `{ value }` is rendered as its matching option's `selected`.
  select: TAG_SELECT, option: TAG_OPTION, optgroup: TAG_OPTGROUP,
});

// One precompiled pattern per raw-text tag. Sharing a /g RegExp across calls
// (and requests) is safe: String.prototype.replace resets lastIndex first.
const RAW_TEXT_CLOSE_RE: Record<string, RegExp> = { script: /<\/(script)/gi, style: /<\/(style)/gi };

function escapeRawText(tagName: string, text: string): string {
  // "</script" (any case) inside a script would close it — break the sequence
  // the same way JSON serializers do ("<\/script").
  return text.replace(RAW_TEXT_CLOSE_RE[tagName], '<\\/$1');
}

/**
 * Serializes a DOM node to HTML string
 */
/**
 * SSR on a real DOM (jsdom, happy-dom): a form control keeps what it shows in
 * properties — `input({ checked })`, `input({ value })` and a select's
 * selected option never become attributes there, so the markup would render
 * an unchecked box, an empty field and the first option. Emit the attributes
 * that make the parsed page show the same state. (The polyfill stores these
 * as attributes already.)
 */
function formStateAttributes(element: Element): string {
  if ((element as HTMLOptionElement).selected !== undefined && element.localName === 'option') {
    const option = element as HTMLOptionElement;
    if (!option.selected || option.hasAttribute('selected')) return '';
    // The first option of a single-choice select is selected by default.
    // (Parent walk rather than closest(): jsdom caches selector matches on
    // the document, which would keep the serialized tree alive.)
    let owner = option.parentNode;
    if (owner && owner.nodeName === 'OPTGROUP') owner = owner.parentNode;
    const select = owner && owner.nodeName === 'SELECT' ? owner as HTMLSelectElement : null;
    return select && !select.multiple && select.options[0] === option ? '' : ' selected';
  }
  const input = element as HTMLInputElement;
  let result = '';
  if (input.checked === true && !input.hasAttribute('checked')) result += ' checked';
  const value = input.value;
  if (typeof value === 'string' && value !== '' && !input.hasAttribute('value')) {
    // An unset checkbox/radio reports the default value "on".
    const toggle = input.type === 'checkbox' || input.type === 'radio';
    if (!(toggle && value === 'on') && input.type !== 'file') result += serializeAttribute('value', value);
  }
  return result;
}

/** Concatenated data of an element's direct text children. */
function textOf(element: Element): string {
  const children = (element as unknown as PolyfillElementShape).children;
  let text = '';
  if (children) {
    for (let i = 0; i < children.length; i++) {
      if (children[i].nodeType === 3) text += children[i].textContent || '';
    }
  }
  return text;
}

/**
 * `selectValue` is the `{ value }` of the enclosing <select> (polyfill trees
 * only): HTML has no value attribute for a select — the matching <option> is
 * marked `selected` instead.
 */
function serializeNode(node: Node, selectValue?: string): string {
  // Text node — only & < > need escaping; quotes are safe in text content
  if (node.nodeType === 3) { // Node.TEXT_NODE
    return escapeText(node.textContent || '');
  }

  // Comment node. nuclo's own markers (flagged by the polyfill) are emitted
  // as they are. In a comment the app supplied, "-->" (or a leading ">") would
  // end it early and expose the rest as markup, so ">" is written as an
  // entity — comments do not decode entities.
  if (node.nodeType === 8) { // Node.COMMENT_NODE
    const data = node.textContent || '';
    return (node as { marker?: boolean }).marker === true || !data.includes('>')
      ? `<!--${data}-->`
      : `<!--${data.replace(/>/g, '&gt;')}-->`;
  }

  // Element node
  if (node.nodeType === 1) { // Node.ELEMENT_NODE
    const element = node as Element;
    // Duck-typed polyfill discriminator (also used by serializeAttributes): a
    // plain Array `children` field never occurs on a real DOM element
    // (HTMLCollection), only on NucloElement and polyfill-shaped test doubles.
    const isPolyfillShape = Array.isArray((element as unknown as PolyfillElementShape).children);
    // Always lowercased: NucloElement already is (toLowerCase() then returns
    // the same string), browser elements report "DIV". An `instanceof
    // NucloElement` shortcut only ever hit in-repo — the published nuclo/ssr
    // and nuclo/polyfill bundles hold different copies of the class.
    const tagName = element.tagName.toLowerCase();
    let category: TagCategory | undefined = TAG_CATEGORY[tagName];
    // <title> inside <svg> is an ordinary element — only HTML's is RCDATA.
    if (category === TAG_RCDATA && element.namespaceURI === SVG_NAMESPACE) category = undefined;
    const textarea = category === TAG_RCDATA && tagName === 'textarea';
    const polyfillAttrs = isPolyfillShape ? (element as unknown as PolyfillElementShape)._attributes : undefined;
    let attributes = serializeAttributes(element, isPolyfillShape, textarea || category === TAG_SELECT);
    if (category === TAG_SELECT) {
      const value = polyfillAttrs?.get('value');
      selectValue = value == null ? undefined : String(value);
    } else if (selectValue !== undefined) {
      if (category === TAG_OPTION) {
        // An option's value defaults to its text.
        const own = polyfillAttrs?.get('value') ?? textOf(element);
        if (String(own) === selectValue && !polyfillAttrs?.has('selected')) attributes += ' selected';
      }
      if (category !== TAG_OPTGROUP) selectValue = undefined;
    }
    if (!isPolyfillShape && (category === TAG_OPTION || tagName === 'input')) {
      attributes += formStateAttributes(element);
    }

    // Self-closing tags
    if (category === TAG_VOID) {
      return `<${tagName}${attributes} />`;
    }

    const childNodes: ArrayLike<Node> = isPolyfillShape ? (element as unknown as PolyfillElementShape).children! : element.childNodes;

    // Raw-text elements: emit text verbatim (no entity escaping, no Nuclo
    // text markers — `<!--` would act as a line comment inside a script).
    if (category === TAG_RAW_TEXT || category === TAG_RCDATA) {
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
      if (category === TAG_RAW_TEXT) {
        return `<${tagName}${attributes}>${escapeRawText(tagName, rawContent)}</${tagName}>`;
      }
      if (textarea) {
        // A textarea's value is its content: `{ value }` (a property on a real
        // element, a stored attribute on the polyfill) wins over text children.
        const value = isPolyfillShape
          ? (element as unknown as PolyfillElementShape)._attributes?.get('value')
          : (element as HTMLTextAreaElement).value;
        if (typeof value === 'string' && value) rawContent = value;
        // The parser drops one newline right after the start tag.
        if (rawContent.charCodeAt(0) === 10) rawContent = '\n' + rawContent;
      }
      return `<${tagName}${attributes}>${escapeText(rawContent)}</${tagName}>`;
    }

    // Regular elements with children. `{ innerHTML }` is a property on a real
    // element (its parsed children are serialized below); the polyfill stores
    // it as an attribute, emitted here verbatim like the browser would parse it.
    const innerHTML = polyfillAttrs?.get('innerHTML');
    let childrenHtml = innerHTML === undefined ? '' : String(innerHTML);
    if (childNodes && childNodes.length > 0) {
      for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        if (child) {
          childrenHtml += serializeNode(child, selectValue);
        }
      }
    } else if (innerHTML === undefined) {
      // Fallback: textContent set directly on the element (e.g. el.textContent = "...")
      const tc = (node as { textContent?: unknown }).textContent;
      if (typeof tc === 'string' && tc) {
        childrenHtml = escapeText(tc);
      }
    }

    return `<${tagName}${attributes}>${childrenHtml}</${tagName}>`;
  }

  // Document fragment
  if (node.nodeType === 11) { // Node.DOCUMENT_FRAGMENT_NODE
    let result = '';
    const childNodes: ArrayLike<Node> = node.childNodes ?? [];
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
 * import 'nuclo/polyfill';
 * import 'nuclo'; // tag builders such as div() are globals only
 * import { renderToString } from 'nuclo/ssr';
 *
 * const html = renderToString(
 *   div("Hello, World!")
 * );
 * // Returns: '<div><!-- text-0 -->Hello, World!</div>'
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
        const container = document.createElement('div') as unknown as ExpandedElement<ElementTagName>;
        // render(App)-style component function: call it for the tree's
        // builder (mirrors render()/hydrate()), run the root hooks, then build.
        let built: unknown = isZeroArityFunction(input) ? (input as () => unknown)() : input;
        runRootHooks(true);
        if (typeof built === 'function') built = (built as NodeModFn<ElementTagName>)(container, 0);
        return built;
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
    .map(([key, value]) => (key === '' || UNSAFE_ATTRIBUTE_NAME.test(key) ? '' : serializeAttribute(key, value)))
    .join('');

  return `<${containerTag}${attrs}>${content}</${containerTag}>`;
}
