import { applyAttributes } from "./attributeManager";
import { createReactiveTextNode } from "./reactive";
import { logError } from "../utility/errorHandler";
import { isFunction, isNode, isObject, isPrimitive, isZeroArityFunction } from "../utility/typeGuards";
import { modifierProbeCache } from "../utility/modifierPredicates";
import { createComment } from "../utility/dom";

export type NodeModifier<TTagName extends ElementTagName = ElementTagName> =
  | NodeMod<TTagName>
  | NodeModFn<TTagName>;

export function applyNodeModifier<TTagName extends ElementTagName>(
  parent: ExpandedElement<TTagName>,
  modifier: NodeModifier<TTagName>,
  index: number,
): Node | null {
  if (modifier == null) return null;

  if (isFunction(modifier)) {
    // Handle zero-argument functions (reactive text or reactive className)
    if (isZeroArityFunction(modifier)) {
      try {
        let record = modifierProbeCache.get(modifier);
        if (!record) {
          const value = (modifier as () => unknown)();
          record = { value, error: false };
          modifierProbeCache.set(modifier, record);
        }
        if (record.error) {
          return createReactiveTextFragment(index, () => "");
        }
        const v = record.value;

        // Check if the returned value is a className object from cn()
        // Must be a plain object with className property, not a Node or other object
        if (isObject(v) && !isNode(v) && 'className' in v && typeof v.className === 'string' && Object.keys(v).length === 1) {
          // Create a wrapper function that extracts className from the modifier result
          const originalModifier = modifier as () => unknown;
          const classNameFn = () => {
            const result = originalModifier();
            return (result as unknown as { className: string }).className;
          };
          applyAttributes(parent, { className: classNameFn } as ExpandedElementAttributes<TTagName>);
          return null;
        }

        if (isPrimitive(v) && v != null) {
          return createReactiveTextFragment(index, modifier as () => Primitive, v);
        }
        return null;
      } catch (error) {
        modifierProbeCache.set(modifier, { value: undefined, error: true });
        logError("Error evaluating reactive text function:", error);
        return createReactiveTextFragment(index, () => "");
      }
    }

    // Handle NodeModFn functions
    const produced = modifier(parent, index);
    if (produced == null) return null;
    if (isPrimitive(produced)) {
      return createStaticTextFragment(index, produced);
    }
    if (isNode(produced)) return produced;
    if (isObject(produced)) {
      applyAttributes(parent, produced as ExpandedElementAttributes<TTagName>);
    }
    return null;
  }

  // Handle non-function modifiers
  const candidate = modifier as NodeMod<TTagName>;
  if (candidate == null) return null;
  if (isPrimitive(candidate)) {
    return createStaticTextFragment(index, candidate);
  }
  if (isNode(candidate)) return candidate;
  if (isObject(candidate)) {
    applyAttributes(parent, candidate as ExpandedElementAttributes<TTagName>);
  }
  return null;
}

function createReactiveTextFragment(
  index: number,
  resolver: () => Primitive,
  preEvaluated?: unknown
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const comment = createComment(` text-${index} `);
  if (comment) fragment.appendChild(comment);
  const textNode = createReactiveTextNode(resolver, preEvaluated);
  fragment.appendChild(textNode);
  return fragment;
}

function createStaticTextFragment(index: number, value: Primitive): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const comment = createComment(` text-${index} `);
  if (comment) fragment.appendChild(comment);
  const textNode = document.createTextNode(String(value));
  fragment.appendChild(textNode);
  return fragment;
}
