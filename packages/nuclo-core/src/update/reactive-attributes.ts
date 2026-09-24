import { logError } from "../shared/errors";
import type { UpdateScope } from "./scope";
import { reactiveElements, reactiveElementsByNode, registerReactiveElement } from "./registry";
import type { AttributeApplier, AttributeResolver, AttributeResolverRecord } from "./registry";
import { isBrowser } from "../shared/environment";

const UNSET_LAST_VALUE = {};

function updateRecord(element: Element, record: AttributeResolverRecord): void {
  let nextValue: unknown;
  try {
    nextValue = record.resolver();
  } catch (e) {
    logError(`Failed to resolve reactive attribute: ${record.key}`, e);
    return;
  }

  // Objects/arrays may be mutated in place (e.g. style objects), so only
  // primitives are compared against the last applied value.
  const cacheable = nextValue === null || typeof nextValue !== "object";
  if (cacheable && Object.is(nextValue, record.lastValue)) return;

  try {
    record.apply(element, record.key, nextValue);
    record.lastValue = cacheable ? nextValue : UNSET_LAST_VALUE;
  } catch (e) {
    logError(`Failed to apply reactive attribute: ${record.key}`, e);
  }
}

/**
 * Makes `resolver` the reactive source of `element`'s `key`: applied now and
 * re-evaluated on every update(). Registering a key again replaces its
 * previous resolver. During SSR the value is applied once and nothing is
 * registered (update() never runs server-side).
 */
export function registerAttributeResolver<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  key: string,
  resolver: AttributeResolver,
  apply: AttributeApplier,
): void {
  const el = element as unknown as Element;
  const record: AttributeResolverRecord = { key, resolver, apply, lastValue: UNSET_LAST_VALUE };
  if (isBrowser) {
    const resolvers = registerReactiveElement(el).attributeResolvers;
    let i = 0;
    while (i < resolvers.length && resolvers[i].key !== key) i++;
    resolvers[i] = record;
  }
  updateRecord(el, record);
}

/**
 * Re-evaluates the attribute resolvers of every registered reactive element
 * (in `scope`, if given). Disconnected and collected elements are pruned as
 * the pass goes.
 */
export function notifyReactiveElements(scope?: UpdateScope): void {
  for (const ref of reactiveElements) {
    const el = ref.deref();
    const entry = el && reactiveElementsByNode.get(el);
    if (!entry || !el.isConnected) {
      if (el) reactiveElementsByNode.delete(el);
      reactiveElements.delete(ref);
      continue;
    }

    if (scope && !scope.contains(el)) continue;

    const resolvers = entry.attributeResolvers;
    for (let i = 0; i < resolvers.length; i++) updateRecord(el, resolvers[i]);
  }
}
