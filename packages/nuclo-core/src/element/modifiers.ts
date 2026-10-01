/**
 * Interprets every argument passed to a tag builder: strings/numbers become
 * text nodes, objects become attributes, functions become reactive text or
 * nested builders, Nodes are appended as-is.
 */
import { applyAttributes } from "./attributes";
import { createReactiveTextNode, toText } from "../update/reactive-text";
import { cleanupReactiveTextNode, registerReactiveTextNode } from "../update/registry";
import { logError } from "../shared/errors";
import { isFunction, isNode, isObject, isPrimitive, isZeroArityFunction } from "../shared/type-guards";
import { isHydrating, isForceHydrating, isSerializing, claimBareText, claimChild, peekChild, setCursor, skipWhitespaceText } from "../hydration";
import { isBrowser } from "../shared/environment";
import { createMarker } from "../shared/dom";

export type NodeModifier<TTagName extends ElementTagName = ElementTagName> =
	| NodeMod<TTagName>
	| NodeModFn<TTagName>
	| AnyParentNodeModifier;

/**
 * Shape of a css()/cx() StyleResult: an object whose only own key is
 * `className`. Typed as readonly to signal it should not be mutated.
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
function claimTextAfterMarker(parent: Node, expected: string): Text {
	const next = peekChild(parent);
	if (next && next.nodeType === 3) {
		claimChild(parent);
		if (next.textContent !== expected) {
			next.textContent = expected;
		}
		return next as Text;
	}
	const created = document.createTextNode(expected);
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
				const v = modifier();

				// A css()/cx() result (only own key: a `className` string) makes this a
				// reactive className instead of reactive text.
				if (isClassNameOnlyObject(v)) {
					const classNameFn = (): string => {
						const result = modifier();
						return isClassNameOnlyObject(result) ? result.className : "";
					};
					applyAttributes(parent, { className: classNameFn } as ExpandedElementAttributes<TTagName>);
					return null;
				}

				if (isPrimitive(v)) {
					// Nullish probes register as empty reactive text instead of being
					// dropped: a resolver with no value yet (data still loading) must
					// stay reactive so a later update() can fill it in. The resolver is
					// registered raw — the notify pass renders nullish/non-primitive
					// results as "" — so no wrapper closure is allocated per text node.
					if (isHydrating()) {
						const parentNode = parent as unknown as Node;
						const expected = toText(v);
						// forceUpdate(): client-rendered text nodes carry no marker —
						// claim the bare text node, patch it, swap in the new resolver.
						if (isForceHydrating()) {
							const claimed = claimBareText(parentNode);
							if (claimed) {
								if (claimed.textContent !== expected) claimed.textContent = expected;
								registerReactiveTextNode(claimed, modifier, expected);
								return null;
							}
						}
						if (nextChildIsTextComment(parentNode)) {
							claimChild(parentNode); // skip <!-- text-N --> comment
							registerReactiveTextNode(claimTextAfterMarker(parentNode, expected), modifier, expected);
							return null;
						}
					}
					return wrapTextNode(index, createReactiveTextNode(modifier, v));
				}
				return null;
			} catch (error) {
				logError("Error evaluating reactive text function:", error);
				return wrapTextNode(index, createReactiveTextNode(emptyText, ""));
			}
		}

		// Handle NodeModFn functions
		const produced = (modifier as NodeModFn<TTagName>)(parent, index);
		if (produced == null) return null;
		if (isPrimitive(produced)) return wrapTextNode(index, document.createTextNode(String(produced)));
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
			const expected = String(candidate);
			// forceUpdate(): claim and patch the bare client-rendered text node.
			// The node may have been reactive in the previous build (the tree
			// shifted) — unregister it, or the next update() would overwrite
			// this static text with the stale resolver's value.
			const force = isForceHydrating();
			if (force) {
				const claimed = claimBareText(parentNode);
				if (claimed) {
					cleanupReactiveTextNode(claimed);
					if (claimed.textContent !== expected) claimed.textContent = expected;
					return null;
				}
			}
			if (nextChildIsTextComment(parentNode)) {
				claimChild(parentNode); // skip <!-- text-N --> comment
				const claimed = claimTextAfterMarker(parentNode, expected);
				if (force) cleanupReactiveTextNode(claimed);
				return null;
			}
		}
		return wrapTextNode(index, document.createTextNode(String(candidate)));
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
 * DOM stays hydratable.
 */
function wrapTextNode(index: number, textNode: Text): Node {
	if (isBrowser && !isHydrating() && !isSerializing()) {
		return textNode;
	}
	const fragment = document.createDocumentFragment();
	fragment.appendChild(createMarker(` text-${index} `));
	fragment.appendChild(textNode);
	return fragment;
}

/** Resolver for text whose first evaluation threw: stays empty. */
function emptyText(): string {
	return "";
}
