import { applyAttributes } from "./attributeManager";
import { createReactiveTextNode } from "./reactiveText";
import { registerReactiveTextNode } from "./reactiveCleanup";
import { logError } from "../utility/errorHandler";
import { isFunction, isNode, isObject, isPrimitive, isZeroArityFunction } from "../utility/typeGuards";
import { modifierProbeCache } from "../utility/modifierPredicates";
import { createComment, createDocumentFragment, createTextNode } from "../utility/dom";
import { isHydrating, claimChild } from "../hydration/context";

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
					return createReactiveTextFragment(index, () => "");
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
					if (isHydrating()) {
						const parentNode = parent as unknown as Node;
						claimChild(parentNode); // skip <!-- text-N --> comment
						const existingText = claimChild(parentNode) as Text;
						if (existingText && existingText.nodeType === 3) {
							registerReactiveTextNode(existingText, {
								resolver: modifier as () => Primitive,
								lastValue: existingText.textContent || '',
							});
						}
						return null;
					}
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
		const produced = (modifier as NodeModFn<TTagName>)(parent, index);
		if (produced == null) return null;
		if (isPrimitive(produced)) return createStaticTextFragment(index, produced);
		if (isNode(produced)) return produced;
		if (isObject(produced)) {
			applyAttributes(parent, produced as ExpandedElementAttributes<TTagName>);
		}
		return null;
	}

	// Handle non-function modifiers
	const candidate = modifier as NodeMod<TTagName>;
	if (isPrimitive(candidate)) {
		if (isHydrating()) {
			const parentNode = parent as unknown as Node;
			claimChild(parentNode); // skip <!-- text-N --> comment
			claimChild(parentNode); // skip text node
			return null;
		}
		return createStaticTextFragment(index, candidate);
	}
	if (isNode(candidate)) return candidate;
	applyAttributes(parent, candidate as ExpandedElementAttributes<TTagName>);
	return null;
}

function createReactiveTextFragment(
	index: number,
	resolver: () => Primitive,
	preEvaluated?: unknown
): DocumentFragment {
	const fragment = createDocumentFragment();
	if (!fragment) {
		throw new Error("Failed to create document fragment: document not available");
	}
	const comment = createComment(` text-${index} `);
	if (comment) fragment.appendChild(comment);
	const textNode = createReactiveTextNode(resolver, preEvaluated);
	fragment.appendChild(textNode);
	return fragment;
}

function createStaticTextFragment(index: number, value: Primitive): DocumentFragment {
	const fragment = createDocumentFragment();
	if (!fragment) {
		throw new Error("Failed to create document fragment: document not available");
	}
	const comment = createComment(` text-${index} `);
	if (comment) fragment.appendChild(comment);
	const textNode = createTextNode(String(value));
	if (textNode) fragment.appendChild(textNode);
	return fragment;
}
