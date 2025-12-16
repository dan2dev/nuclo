// Import all organized type definitions
import "./core/base";
import "./svg/base";
import "./html/tags";
import "./svg/tags";
import "./features/list";
import "./features/when";
import "./features/update";
import "./features/scope";
import "./features/on";
import "./features/render";
import "./features/style";
import "./features/utilities";

// Re-export functions for module-style consumers (import { ... } from "nuclo")

// Core reactive utilities
export function list<T>(items: () => T[], builder: (item: T, index: number) => NodeModFn): NodeModFn;
export function when(condition: () => boolean): { then: (builder: () => NodeModFn) => { else?: (builder: () => NodeModFn) => NodeModFn } };
export function update(...scopeIds: string[]): void;

// Scope utilities
export function scope<TTagName extends ElementTagName = ElementTagName>(...ids: string[]): NodeModFn<TTagName>;
export function cleanupAllScopes(): void;

// Event handling
export function on<K extends keyof HTMLElementEventMap, TTagName extends ElementTagName = ElementTagName>(
  type: K,
  listener: (ev: HTMLElementEventMap[K]) => unknown,
  options?: boolean | AddEventListenerOptions
): NodeModFn<TTagName>;
export function on<K extends string, E extends Event = Event, TTagName extends ElementTagName = ElementTagName>(
  type: K,
  listener: (ev: E) => unknown,
  options?: boolean | AddEventListenerOptions
): NodeModFn<TTagName>;

// Render utility
export function render<TTagName extends ElementTagName = ElementTagName>(
  nodeModFn: NodeModFn<TTagName>,
  parent?: Element,
  index?: number
): ExpandedElement<TTagName>;

// Factory functions
export function createHtmlTagBuilder<TTagName extends ElementTagName = ElementTagName>(
  tagName: TTagName
): ExpandedElementBuilder<TTagName>;

export function createSvgTagBuilder<TTagName extends keyof SVGElementTagNameMap>(
  tagName: TTagName
): ExpandedElementBuilder<ElementTagName>;

export function createHtmlElementWithModifiers<TTagName extends ElementTagName = ElementTagName>(
  tagName: TTagName,
  rawMods: (NodeMod<TTagName> | NodeModFn<TTagName>)[]
): (parent?: ExpandedElement<TTagName>, index?: number) => ExpandedElement<TTagName>;

export function createSvgElementWithModifiers<TTagName extends keyof SVGElementTagNameMap>(
  tagName: TTagName,
  rawMods: (NodeMod<ElementTagName> | NodeModFn<ElementTagName>)[]
): (parent?: ExpandedElement<ElementTagName>, index?: number) => ExpandedElement<ElementTagName>;

// Core processors
export function applyNodeModifier<TTagName extends ElementTagName = ElementTagName>(
  parent: ExpandedElement<TTagName>,
  mod: NodeMod<TTagName> | NodeModFn<TTagName>,
  index: number
): void;

export function applyAttributes<TTagName extends ElementTagName = ElementTagName>(
  element: ExpandedElement<TTagName>,
  attributes: ExpandedElementAttributes<TTagName>
): void;

// DOM utilities
export function appendChildren(parent: Element, children: Node[]): void;
export function createComment(text: string): Comment;
export function createConditionalComment(text: string): Comment;
export function replaceNodeSafely(oldNode: Node, newNode: Node): void;

// Type guards
export function isBoolean(value: unknown): value is boolean;
export function isFunction(value: unknown): value is Function;
export function isNode(value: unknown): value is Node;
export function isObject(value: unknown): value is Record<string, unknown>;
export function isPrimitive(value: unknown): value is Primitive;
export function isTagLike(value: unknown): value is ExpandedElement;
export function isZeroArityFunction(value: unknown): value is () => unknown;

// Environment detection
export function isBrowser(): boolean;

export {};
