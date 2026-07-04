/**
 * Interprets every argument passed to a tag builder: strings/numbers become
 * text nodes, objects become attributes, functions become reactive text or
 * nested builders, Nodes are appended as-is.
 */
import { applyAttributes } from "./attributes";
import { createReactiveTextNode } from "../update/reactive-text";
import { registerReactiveTextNode } from "../update/registry";
import { logError } from "../shared/errors";
import { isFunction, isNode, isObject, isPrimitive, isZeroArityFunction } from "../shared/type-guards";
import { createComment, createDocumentFragment, createTextNode } from "../shared/dom";
import { isHydrating, isSerializing, claimChild, peekChild, setCursor, skipWhitespaceText } from "../hydration";
import { isBrowser } from "../shared/environment";

/**
 * Caches the probe result of zero-arity function modifiers so the same
 * function is not re-invoked when it reappears during re-renders.
 */
export const modifierProbeCache = new WeakMap<() => unknown, { value: unknown; error: boolean }>();

export type NodeModifier<TTagName extends ElementTagName = ElementTagName> =
	| NodeMod<TTagName>
	| NodeModFn<TTagName>;

/**
 * Shape returned by cn() helper: a plain object with exactly one key `className`.
 * Typed as readonly to signal it should not be mutated after creation.
 */
interface ClassNameOnlyObject {
	readonly className: string;
}

function isClassNameOnlyObject(v: unknown): v is ClassNameOnlyObject {
	return (
		isObject(v) &&
		!isNode(v) &&
		'className' in v &&
		typeof (v as { className: unknown }).className === 'string' &&
		Object.keys(v).length === 1
	);
}

function nextChildIsTextComment(parent: Node): boolean {
	skipWhitespaceText(parent);
	const child = peekChild(parent);
	return !!child && child.nodeType === 8 &&
		(child as Comment).textContent?.trimStart().startsWith('text-') === true;
}

/**
 * Claims the text node that follows an already-claimed `<!-- text-N -->`
 * marker and patches its content to the client value.
 *
 * The HTML parser drops empty text nodes, so SSR output for an empty string
 * has a marker with no text node after it — in that case a fresh text node is
 * inserted at the cursor to keep the DOM identical to a client render.
 * Content mismatches (data changed between SSR and hydration) are patched so
 * hydration always converges on the client value.
 */
function claimTextAfterMarker(parent: Node, expected: string): Text | null {
	const next = peekChild(parent);
	if (next && next.nodeType === 3) {
		claimChild(parent);
		if (next.textContent !== expected) {
			next.textContent = expected;
		}
		return next as Text;
	}
	const created = createTextNode(expected);
	if (!created) return null;
	parent.insertBefore(created, next);
	setCursor(parent, next);
	return created;
}

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
					const value = modifier();
					record = { value, error: false };
					modifierProbeCache.set(modifier, record);
				}
				if (record.error) {
					return createReactiveTextChild(index, () => "");
				}
				const v = record.value;

				// Detect cn() result: plain object with only a `className` string key
				if (isClassNameOnlyObject(v)) {
					const classNameFn = (): string => {
						const result = modifier();
						return isClassNameOnlyObject(result) ? result.className : "";
					};
					applyAttributes(parent, { className: classNameFn } as ExpandedElementAttributes<TTagName>);
					return null;
				}

				if (isPrimitive(v) && v != null) {
					if (isHydrating() && nextChildIsTextComment(parent as unknown as Node)) {
						const parentNode = parent as unknown as Node;
						claimChild(parentNode); // skip <!-- text-N --> comment
						const expected = String(v);
						const textNode = claimTextAfterMarker(parentNode, expected);
						if (textNode) {
							registerReactiveTextNode(textNode, {
								resolver: modifier as () => Primitive,
								lastValue: expected,
							});
						}
						return null;
					}
					return createReactiveTextChild(index, modifier as () => Primitive, v);
				}
				return null;
			} catch (error) {
				modifierProbeCache.set(modifier, { value: undefined, error: true });
				logError("Error evaluating reactive text function:", error);
				return createReactiveTextChild(index, () => "");
			}
		}

		// Handle NodeModFn functions
		const produced = (modifier as NodeModFn<TTagName>)(parent, index);
		if (produced == null) return null;
		if (isPrimitive(produced)) return createStaticTextChild(index, produced);
		if (isNode(produced)) return produced;
		if (isObject(produced)) {
			applyAttributes(parent, produced as ExpandedElementAttributes<TTagName>);
		}
		return null;
	}

	// Handle non-function modifiers
	const candidate = modifier as NodeMod<TTagName>;
	if (isPrimitive(candidate)) {
		if (isHydrating() && nextChildIsTextComment(parent as unknown as Node)) {
			const parentNode = parent as unknown as Node;
			claimChild(parentNode); // skip <!-- text-N --> comment
			claimTextAfterMarker(parentNode, String(candidate));
			return null;
		}
		return createStaticTextChild(index, candidate);
	}
	if (isNode(candidate)) return candidate;
	applyAttributes(parent, candidate as ExpandedElementAttributes<TTagName>);
	return null;
}

/**
 * Wraps a freshly created text node for insertion.
 *
 * The `<!-- text-N -->` marker only exists so hydration can pair an SSR text
 * node with its client resolver. A pure client render never hydrates, so the
 * marker (and the DocumentFragment that carries it) is dead weight: two extra
 * DOM nodes and a fragment allocation per text child that nothing ever reads.
 * In that case we return the bare text node — halving the per-row DOM node
 * count and the DOM inserts in list-heavy renders.
 *
 * SSR (isBrowser === false, or renderToString's serialization mode) and the
 * hydration-mismatch fresh-render path keep the marker so the emitted/repaired
 * DOM stays hydratable. A null text node (document unavailable) is skipped,
 * matching the previous per-path guards.
 */
function wrapTextNode(index: number, textNode: Node | null): Node | null {
	if (isBrowser && !isHydrating() && !isSerializing()) {
		return textNode;
	}
	const fragment = createDocumentFragment();
	if (!fragment) {
		throw new Error("Failed to create document fragment: document not available");
	}
	const comment = createComment(` text-${index} `);
	if (comment) fragment.appendChild(comment);
	if (textNode) fragment.appendChild(textNode);
	return fragment;
}

function createReactiveTextChild(
	index: number,
	resolver: () => Primitive,
	preEvaluated?: unknown
): Node | null {
	return wrapTextNode(index, createReactiveTextNode(resolver, preEvaluated));
}

function createStaticTextChild(index: number, value: Primitive): Node | null {
	return wrapTextNode(index, createTextNode(String(value)));
}
