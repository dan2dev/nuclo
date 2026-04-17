import { applyAttributes } from "./attributeManager";
import { createReactiveTextNode } from "./reactiveText";
import { registerReactiveTextNode } from "./reactiveCleanup";
import { logError } from "../utility/errorHandler";
import {
  isNode,
  isPrimitive,
  isZeroArityFunction,
} from "../utility/typeGuards";
import { modifierProbeCache } from "../utility/modifierPredicates";
import {
  createComment,
  createDocumentFragment,
  createTextNode,
} from "../utility/dom";
import { isHydrating, claimChild, getCursor } from "../hydration/context";

/**
 * A modifier is anything that can attach itself to a parent element:
 * primitives become text, objects become attribute bags, functions produce
 * children or reactive text, and full `NodeModFn` values get invoked with
 * `(parent, index)`.
 *
 * @template TTagName Host element tag literal.
 */
export type NodeModifier<TTagName extends ElementTagName = ElementTagName> =
  | NodeMod<TTagName>
  | NodeModFn<TTagName>;

/** Shape returned by cn() helper: plain object with only `className: string`. */
interface ClassNameOnlyObject {
  readonly className: string;
}

/**
 * Unified callable shape for non-zero-arity modifier functions. The
 * `NodeModifier<T>` union admits both `NodeModFn<T>` (returns `NodeMod | void`)
 * and the child-returning `NodeMod` function variant (returns `Node`). Both
 * take `(parent, index)` and return something the classifier below handles,
 * so we invoke via this common signature once and then discriminate on the
 * produced value.
 *
 * @template TTagName Host element tag literal.
 */
type ModifierInvocation<TTagName extends ElementTagName> = (
  parent: ExpandedElement<TTagName>,
  index: number,
) => NodeMod<TTagName> | Node | void;

function isClassNameOnlyObject(v: unknown): v is ClassNameOnlyObject {
  if (v === null || typeof v !== "object") return false;
  if (isNode(v)) return false;
  const obj = v as Record<string, unknown>;
  if (typeof obj.className !== "string") return false;
  // Count keys without allocating Object.keys().
  let count = 0;
  for (const _ in obj) if (++count > 1) return false;
  return count === 1;
}

function nextChildIsTextComment(parent: Node): boolean {
  const cursor = getCursor(parent);
  const child = parent.childNodes[cursor];
  if (!child || child.nodeType !== 8) return false;
  const text = child.textContent;
  return text != null && text.trimStart().startsWith("text-");
}

/**
 * Applies a single modifier to its parent element and returns either a DOM
 * node to be appended by the caller, or `null` for attribute-only modifiers.
 *
 * Narrowing is driven by `typeof` discrimination on the modifier value —
 * primitives, zero-arity reactive functions, non-zero-arity `NodeModFn`s,
 * and attribute-bag / Node objects all take distinct branches.
 *
 * @template TTagName Host element tag literal.
 */
export function applyNodeModifier<TTagName extends ElementTagName>(
  parent: ExpandedElement<TTagName>,
  modifier: NodeModifier<TTagName>,
  index: number,
): Node | null {
  if (modifier == null) return null;

  // Fast path #1: primitive text
  if (isPrimitive(modifier)) {
    if (isHydrating() && nextChildIsTextComment(parent)) {
      claimChild(parent); // skip <!-- text-N -->
      claimChild(parent); // skip text
      return null;
    }
    return createStaticTextFragment(index, modifier);
  }

  // Fast path #2: function — either zero-arity (reactive) or NodeModFn
  if (typeof modifier === "function") {
    if (isZeroArityFunction(modifier)) {
      return handleZeroArityModifier(parent, modifier, index);
    }
    // NodeModFn(parent, index) — classify produced value
    const produced = (modifier as ModifierInvocation<TTagName>)(parent, index);
    if (produced == null) return null;
    if (isPrimitive(produced)) {
      return createStaticTextFragment(index, produced);
    }
    if (isNode(produced)) return produced;
    applyAttributes(parent, produced as ExpandedElementAttributes<TTagName>);
    return null;
  }

  // Fast path #3: object — either a Node or an attributes bag
  if (isNode(modifier)) return modifier;
  applyAttributes(parent, modifier as ExpandedElementAttributes<TTagName>);
  return null;
}

/**
 * Handles a zero-arg function modifier. Result can be:
 *  - A cn()-style `{ className }` object → becomes a reactive className binding.
 *  - A primitive → becomes a reactive text node.
 *  - `null` / `undefined` or other objects → no-op.
 *
 * Probes via `modifierProbeCache` so error + value classifications survive
 * across hydration + rebuild cycles without re-running user code unnecessarily.
 *
 * @template TTagName Host element tag literal.
 */
function handleZeroArityModifier<TTagName extends ElementTagName>(
  parent: ExpandedElement<TTagName>,
  modifier: () => unknown,
  index: number,
): Node | null {
  let record = modifierProbeCache.get(modifier);
  if (!record) {
    try {
      record = { value: modifier(), error: false };
    } catch (error) {
      record = { value: undefined, error: true };
      logError("Error evaluating reactive text function:", error);
    }
    modifierProbeCache.set(modifier, record);
  }
  if (record.error) return createReactiveTextFragment(index, () => "");

  const v = record.value;

  // cn({...}) result → reactive className
  if (isClassNameOnlyObject(v)) {
    const classNameFn = (): string => {
      const result = modifier();
      return isClassNameOnlyObject(result) ? result.className : "";
    };
    applyAttributes(parent, {
      className: classNameFn,
    } as ExpandedElementAttributes<TTagName>);
    return null;
  }

  // primitive (non-null) → reactive text node
  if (v !== null && v !== undefined && isPrimitive(v)) {
    if (isHydrating() && nextChildIsTextComment(parent)) {
      claimChild(parent); // skip <!-- text-N -->
      const existingText = claimChild(parent);
      if (existingText && existingText.nodeType === 3) {
        registerReactiveTextNode(existingText as Text, {
          resolver: modifier as () => Primitive,
          lastValue: existingText.textContent || "",
        });
      }
      return null;
    }
    return createReactiveTextFragment(index, modifier as () => Primitive, v);
  }
  return null;
}

function createReactiveTextFragment(
  index: number,
  resolver: () => Primitive,
  preEvaluated?: unknown,
): DocumentFragment {
  const fragment = createDocumentFragment();
  if (!fragment)
    throw new Error(
      "Failed to create document fragment: document not available",
    );
  const comment = createComment(` text-${index} `);
  if (comment) fragment.appendChild(comment);
  fragment.appendChild(createReactiveTextNode(resolver, preEvaluated));
  return fragment;
}

function createStaticTextFragment(
  index: number,
  value: Primitive,
): DocumentFragment {
  const fragment = createDocumentFragment();
  if (!fragment)
    throw new Error(
      "Failed to create document fragment: document not available",
    );
  const comment = createComment(` text-${index} `);
  if (comment) fragment.appendChild(comment);
  const textNode = createTextNode(String(value));
  if (textNode) fragment.appendChild(textNode);
  return fragment;
}
