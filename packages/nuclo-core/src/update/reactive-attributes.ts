import { logError } from "../shared/errors";
import { membersOf, ELEMENT_KIND, type UpdateScope } from "./scope";
import { reactiveElements, reactiveElementsByNode, registerReactiveElement } from "./registry";
import type { AttributeApplier, AttributeResolver, AttributeResolverRecord } from "./registry";
import { isBrowser } from "../shared/environment";
import { isSerializing } from "../shared/serializing";

const UNSET_LAST_VALUE = {};

function updateRecord(element: Element, record: AttributeResolverRecord) {
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
    const applied = record.apply(element, record.key, nextValue);
    record.lastValue = cacheable && applied !== false ? nextValue : UNSET_LAST_VALUE;
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
) {
  const el = element as unknown as Element;
  const record: AttributeResolverRecord = { key, resolver, apply, lastValue: UNSET_LAST_VALUE };
  if (isBrowser && !isSerializing()) {
    const resolvers = registerReactiveElement(el).attributeResolvers;
    let i = 0;
    while (i < resolvers.length && resolvers[i].key !== key) i++;
    resolvers[i] = record;
  }
  updateRecord(el, record);
}

/**
 * Re-evaluates the attribute resolvers of every registered reactive element
 * (under `scope`'s roots, if given). Disconnected and collected elements are
 * pruned as the pass goes.
 */
export function notifyReactiveElements(scope?: UpdateScope) {
  if (!scope) return notifyElementSet(reactiveElements);
  for (const root of scope.roots) notifyElementSet(membersOf(root, ELEMENT_KIND) as Set<WeakRef<Element>>);
}

function notifyElementSet(set: Set<WeakRef<Element>>) {
  for (const ref of set) {
    const el = ref.deref();
    const entry = el && reactiveElementsByNode.get(el);
    // A scope member whose element was unregistered and registered again
    // (forceUpdate() reclaim) is stale: its live entry carries a newer ref.
    if (!entry || entry.ref !== ref || !el.isConnected) {
      if (entry && entry.ref === ref) reactiveElementsByNode.delete(el);
      set.delete(ref);
      reactiveElements.delete(ref);
      continue;
    }

    const resolvers = entry.attributeResolvers;
    for (let i = 0; i < resolvers.length; i++) updateRecord(el, resolvers[i]);
  }
}
