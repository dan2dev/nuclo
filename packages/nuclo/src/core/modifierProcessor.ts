import { applyAttributes } from "./attributeManager";
import { createReactiveTextNode } from "./reactive";
import { logError } from "../utility/errorHandler";
import { isFunction, isNode, isObject, isPrimitive } from "../utility/typeGuards";
import { modifierProbeCache } from "../utility/modifierPredicates";
export { isConditionalModifier, findConditionalModifier } from "../utility/modifierPredicates";

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
    if (modifier.length === 0) {
      try {
        let record = modifierProbeCache.get(modifier as Function);
        if (!record) {
          const value = (modifier as () => unknown)();
          record = { value, error: false };
          modifierProbeCache.set(modifier as Function, record);
        }
        if (record.error) {
          const fragment = document.createDocumentFragment();
          const comment = document.createComment(` text-${index} `);
          const textNode = createReactiveTextNode(() => "");
          fragment.appendChild(comment);
          fragment.appendChild(textNode);
          return fragment;
        }
        const v = record.value;
        if (isPrimitive(v) && v != null) {
          const fragment = document.createDocumentFragment();
          const comment = document.createComment(` text-${index} `);
          const textNode = createReactiveTextNode(modifier as () => Primitive, v);
          fragment.appendChild(comment);
          fragment.appendChild(textNode);
          return fragment;
        }
        return null;
      } catch (error) {
        modifierProbeCache.set(modifier as Function, { value: undefined, error: true });
        logError("Error evaluating reactive text function:", error);
        const fragment = document.createDocumentFragment();
        const comment = document.createComment(` text-${index} `);
        const textNode = createReactiveTextNode(() => "");
        fragment.appendChild(comment);
        fragment.appendChild(textNode);
        return fragment;
      }
    }

    const produced = (modifier as NodeModFn<TTagName>)(parent, index);
    if (produced == null) return null;
    if (isPrimitive(produced)) {
      const fragment = document.createDocumentFragment();
      const comment = document.createComment(` text-${index} `);
      const textNode = document.createTextNode(String(produced));
      fragment.appendChild(comment);
      fragment.appendChild(textNode);
      return fragment;
    }
    if (isNode(produced)) return produced;
    if (isObject(produced)) {
      applyAttributes(parent, produced as ExpandedElementAttributes<TTagName>);
    }
    return null;
  }

  const candidate = modifier as NodeMod<TTagName>;
  if (candidate == null) return null;
  if (isPrimitive(candidate)) {
    const fragment = document.createDocumentFragment();
    const comment = document.createComment(` text-${index} `);
    const textNode = document.createTextNode(String(candidate));
    fragment.appendChild(comment);
    fragment.appendChild(textNode);
    return fragment;
  }
  if (isNode(candidate)) return candidate;
  if (isObject(candidate)) {
    applyAttributes(parent, candidate as ExpandedElementAttributes<TTagName>);
  }
  return null;
}
