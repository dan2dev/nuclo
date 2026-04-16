import { applyAttributes } from "./attributeManager";
import { createReactiveTextNode } from "./reactiveText";
import { registerReactiveTextNode } from "./reactiveCleanup";
import { logError } from "../utility/errorHandler";
import { isNode } from "../utility/typeGuards";
import { modifierProbeCache } from "../utility/modifierPredicates";
import {
  createComment,
  createDocumentFragment,
  createTextNode,
} from "../utility/dom";
import { isHydrating, claimChild, getCursor } from "../hydration/context";

export type NodeModifier<TTagName extends ElementTagName = ElementTagName> =
  | NodeMod<TTagName>
  | NodeModFn<TTagName>;

/** Shape returned by cn() helper: plain object with only `className: string`. */
interface ClassNameOnlyObject {
  readonly className: string;
}

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
  const text = (child as Comment).textContent;
  return text != null && text.trimStart().startsWith("text-");
}

export function applyNodeModifier<TTagName extends ElementTagName>(
  parent: ExpandedElement<TTagName>,
  modifier: NodeModifier<TTagName>,
  index: number,
): Node | null {
  if (modifier == null) return null;

  const t = typeof modifier;

  // Fast path #1: primitive text
  if (t !== "object" && t !== "function") {
    if (isHydrating() && nextChildIsTextComment(parent as unknown as Node)) {
      const parentNode = parent as unknown as Node;
      claimChild(parentNode); // skip <!-- text-N -->
      claimChild(parentNode); // skip text
      return null;
    }
    return createStaticTextFragment(index, modifier as Primitive);
  }

  // Fast path #2: function — either zero-arity (reactive) or NodeModFn
  if (t === "function") {
    const fn = modifier as (...args: unknown[]) => unknown;
    if (fn.length === 0) {
      return handleZeroArityModifier(parent, fn as () => unknown, index);
    }
    // NodeModFn(parent, index) — classify produced value
    const produced = (modifier as NodeModFn<TTagName>)(parent, index);
    if (produced == null) return null;
    const pt = typeof produced;
    if (pt !== "object" && pt !== "function") {
      return createStaticTextFragment(index, produced as Primitive);
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
 *  - A cn()-style { className } object → becomes a reactive className binding.
 *  - A primitive → becomes a reactive text node.
 *  - null/undefined or other objects → no-op.
 *
 * Probes via modifierProbeCache so error + value classifications survive across
 * hydration + rebuild cycles without re-running user code unnecessarily.
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
  if (v !== null && v !== undefined) {
    const vt = typeof v;
    if (vt !== "object" && vt !== "function") {
      if (isHydrating() && nextChildIsTextComment(parent as unknown as Node)) {
        const parentNode = parent as unknown as Node;
        claimChild(parentNode); // skip <!-- text-N -->
        const existingText = claimChild(parentNode) as Text | null;
        if (existingText && existingText.nodeType === 3) {
          registerReactiveTextNode(existingText, {
            resolver: modifier as () => Primitive,
            lastValue: existingText.textContent || "",
          });
        }
        return null;
      }
      return createReactiveTextFragment(index, modifier as () => Primitive, v);
    }
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
