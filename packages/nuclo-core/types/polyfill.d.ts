/**
 * Type declarations for the `nuclo/polyfill` subpath.
 *
 * Hand-written (mirroring src/polyfill/index.ts) and shipped from `types/` so
 * the subpath stays typed even when `dist/` holds only watch-mode JS bundles —
 * `tsdown --watch` cleans dist and emits no declarations. Keep in sync with
 * src/polyfill/*.
 *
 * The primary use is the side-effect import (`import "nuclo/polyfill"`), which
 * installs document/Node/Element/HTMLElement on globalThis when they are
 * missing (Node.js SSR). The named exports below expose the polyfill classes.
 */

// Load the ambient nuclo globals (ExpandedElement, ElementTagName, …).
import "./index";

/** Minimal Node base used for instanceof checks in the Node.js polyfill. */
export class NucloNode {
	nodeType: number;
	nodeName: string;
	nodeValue: string | null;
	parentNode: unknown;
	textContent: string;
	get childNodes(): NodeListOf<ChildNode>;
}

/** Text node polyfill. */
export class NucloText {
	nodeType: number;
	nodeName: string;
	data: string;
	textContent: string;
	parentNode: unknown;
	nodeValue: string;
	constructor(data: string);
}

/** Element polyfill: the subset of the DOM Element surface nuclo SSR uses. */
export class NucloElement extends NucloNode {
	tagName: string;
	children: unknown[];
	className: string;
	id: string;
	namespaceURI?: string;
	attributes: Map<string, string>;
	style: CSSStyleDeclaration;
	classList: DOMTokenList;
	/** Every child node (same array as `children`). */
	get childNodes(): NodeListOf<ChildNode>;
	constructor(tagName: string);
	appendChild<T extends Node>(child: T): T;
	insertBefore<T extends Node>(newNode: T, referenceNode: Node | null): T;
	removeChild<T extends Node>(child: T): T;
	replaceChild<T extends Node>(newChild: Node, oldChild: T): T;
	setAttribute(name: string, value: string): void;
	getAttribute(name: string): string | null;
	removeAttribute(name: string): void;
	hasAttribute(name: string): boolean;
	/** SSR never dispatches events: listeners are accepted and dropped. */
	addEventListener(type: string, listener: EventListener): void;
	removeEventListener(type: string, listener: EventListener): void;
	dispatchEvent(event: Event): boolean;
	/** Always null / empty: serialize with renderToString instead of querying. */
	querySelector(selector: string): Element | null;
	querySelectorAll(selector: string): NodeListOf<Element>;
}

/** Document polyfill backing `document` in Node.js. */
export class NucloDocument {
	head: ExpandedElement;
	body: ExpandedElement;
	createElement(tagName: string, options?: unknown): ExpandedElement;
	createElementNS(namespace: string, tagName: string, options?: unknown): ExpandedElement;
	createTextNode(data: string): Text;
	createComment(data: string): Comment;
	createDocumentFragment(): DocumentFragment;
	querySelector(selector: string): Element | null;
	querySelectorAll(selector: string): NodeListOf<Element>;
	addEventListener(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): void;
	removeEventListener(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): void;
	dispatchEvent(event: Event): boolean;
	contains(node: Node): boolean;
}

/** The active document: the browser global when present, else the polyfill. */
export const document: Document | NucloDocument;
/** The runtime's own Event constructor (built into Node >= 19, Bun and Deno). */
export const Event: typeof globalThis.Event;
/** The runtime's own CustomEvent constructor (built into Node >= 19, Bun and Deno). */
export const CustomEvent: typeof globalThis.CustomEvent;
/** Alias of NucloNode (installed as globalThis.Node when missing). */
export const Node: typeof NucloNode;
/** Alias of NucloElement (installed as globalThis.Element when missing). */
export const Element: typeof NucloElement;
/** Alias of NucloElement (installed as globalThis.HTMLElement when missing). */
export const HTMLElement: typeof NucloElement;
