// Import all organized type definitions
import "./core/base";
import "./svg/base";
import "./html/tags";
import "./svg/tags";
import "./features/list";
import "./features/when";
import "./features/update";
import "./features/on";
import "./features/render";
import "./features/style";

// Re-export on() helper for module-style consumers (import { on } from "nuclo")
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

export {};