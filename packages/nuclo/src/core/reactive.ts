import { logError, safeExecute } from "../utility/errorHandler";
import { isNodeConnected } from "../utility/dom";

type TextResolver = () => Primitive;
type AttributeResolver = () => unknown;

interface AttributeResolverRecord {
  resolver: AttributeResolver;
  applyValue: (value: unknown) => void;
}

interface ReactiveTextNodeInfo {
  resolver: TextResolver;
  lastValue: string;
}

interface ReactiveElementInfo {
  attributeResolvers: Map<string, AttributeResolverRecord>;
  updateListener?: EventListener;
}

const reactiveTextNodes = new Map<Text, ReactiveTextNodeInfo>();
const reactiveElements = new Map<Element, ReactiveElementInfo>();

function ensureElementInfo(el: Element): ReactiveElementInfo {
  let info = reactiveElements.get(el);
  if (!info) {
    info = { attributeResolvers: new Map() };
    reactiveElements.set(el, info);
  }
  return info;
}

function applyAttributeResolvers(el: Element, info: ReactiveElementInfo): void {
  info.attributeResolvers.forEach(({ resolver, applyValue }, key) => {
    try {
      applyValue(safeExecute(resolver));
    } catch (e) {
      logError(`Failed to update reactive attribute: ${key}`, e);
    }
  });
}

export function createReactiveTextNode(resolver: TextResolver, preEvaluated?: unknown): Text | DocumentFragment {
  if (typeof resolver !== "function") {
    logError("Invalid resolver provided to createReactiveTextNode");
    return document.createTextNode("");
  }

  const initial = arguments.length > 1 ? preEvaluated : safeExecute(resolver, "");
  const str = initial === undefined ? "" : String(initial);
  const txt = document.createTextNode(str);

  reactiveTextNodes.set(txt, { resolver, lastValue: str });
  return txt;
}

export function registerAttributeResolver<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  key: string,
  resolver: AttributeResolver,
  applyValue: (value: unknown) => void
): void {
  if (!(element instanceof Element) || !key || typeof resolver !== "function") {
    logError("Invalid parameters for registerAttributeResolver");
    return;
  }
  const info = ensureElementInfo(element as Element);
  info.attributeResolvers.set(key, { resolver, applyValue });

  try {
    applyValue(safeExecute(resolver));
  } catch (e) {
    logError("Failed to apply initial attribute value", e);
  }

  if (!info.updateListener) {
    const listener: EventListener = () => applyAttributeResolvers(element as Element, info);
    (element as Element).addEventListener("update", listener);
    info.updateListener = listener;
  }
}

export function notifyReactiveTextNodes(): void {
  reactiveTextNodes.forEach((info, node) => {
    if (!isNodeConnected(node)) {
      reactiveTextNodes.delete(node);
      return;
    }
    try {
      const raw = safeExecute(info.resolver);
      const newVal = raw === undefined ? "" : String(raw);
      if (newVal !== info.lastValue) {
        node.textContent = newVal;
        info.lastValue = newVal;
      }
    } catch (e) {
      logError("Failed to update reactive text node", e);
    }
  });
}

export function notifyReactiveElements(): void {
  reactiveElements.forEach((info, el) => {
    if (!isNodeConnected(el)) {
      if (info.updateListener) el.removeEventListener("update", info.updateListener);
      reactiveElements.delete(el);
      return;
    }
    applyAttributeResolvers(el, info);
  });
}
