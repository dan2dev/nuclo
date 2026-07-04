/**
 * Type declarations for the `nuclo/polyfill` subpath.
 *
 * Hand-written (mirroring src/polyfill/index.ts) and shipped from `types/` so
 * the subpath stays typed even when `dist/` holds only watch-mode JS bundles —
 * `tsdown --watch` cleans dist and emits no declarations. Keep in sync with
 * src/polyfill/*.
 *
 * The primary use is the side-effect import (`import "nuclo/polyfill"`), which
 * installs document/Event/Node/Element/HTMLElement on globalThis when they are
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
	sheet?: CSSStyleSheet | null;
	rawMods?: unknown[];
	mods?: unknown[];
	attributes: Map<string, string>;
	style: CSSStyleDeclaration;
	classList: DOMTokenList;
	innerHTML: string;
	constructor(tagName: string);
	appendChild<T extends Node>(child: T): T;
	insertBefore<T extends Node>(newNode: T, referenceNode: Node | null): T;
	removeChild<T extends Node>(child: T): T;
	replaceChild<T extends Node>(newChild: Node, oldChild: T): T;
	setAttribute(name: string, value: string): void;
	getAttribute(name: string): string | null;
	removeAttribute(name: string): void;
	hasAttribute(name: string): boolean;
	addEventListener(type: string, listener: EventListener): void;
	removeEventListener(type: string, listener: EventListener): void;
	dispatchEvent(event: Event): boolean;
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

/** Event polyfill (structurally compatible with the DOM Event interface). */
export class NucloEvent implements Event {
	type: string;
	bubbles: boolean;
	cancelable: boolean;
	composed: boolean;
	currentTarget: EventTarget | null;
	defaultPrevented: boolean;
	eventPhase: number;
	isTrusted: boolean;
	target: EventTarget | null;
	timeStamp: number;
	readonly AT_TARGET: 2;
	readonly BUBBLING_PHASE: 3;
	readonly CAPTURING_PHASE: 1;
	readonly NONE: 0;
	returnValue: boolean;
	srcElement: EventTarget | null;
	cancelBubble: boolean;
	constructor(type: string, eventInitDict?: EventInit);
	composedPath(): EventTarget[];
	initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void;
	preventDefault(): void;
	stopImmediatePropagation(): void;
	stopPropagation(): void;
}

/** CustomEvent polyfill. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class NucloCustomEvent<T = any> extends NucloEvent implements CustomEvent<T> {
	detail: T;
	constructor(type: string, eventInitDict?: CustomEventInit<T>);
	initCustomEvent(type: string, bubbles?: boolean, cancelable?: boolean, detail?: T): void;
}

/** The active document: the browser global when present, else the polyfill. */
export const document: Document | NucloDocument;
/** The active Event constructor: the browser global when present, else the polyfill. */
export const Event: typeof globalThis.Event | typeof NucloEvent;
/** The active CustomEvent constructor: the browser global when present, else the polyfill. */
export const CustomEvent: typeof globalThis.CustomEvent | typeof NucloCustomEvent;
/** Alias of NucloNode (installed as globalThis.Node when missing). */
export const Node: typeof NucloNode;
/** Alias of NucloElement (installed as globalThis.Element when missing). */
export const Element: typeof NucloElement;
/** Alias of NucloElement (installed as globalThis.HTMLElement when missing). */
export const HTMLElement: typeof NucloElement;
