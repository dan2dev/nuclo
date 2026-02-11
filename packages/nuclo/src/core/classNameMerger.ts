const REACTIVE_CLASSNAME_KEY = '__nuclo_reactive_className__';
const STATIC_CLASSNAME_KEY = '__nuclo_static_className__';

/**
 * Splits a className string into non-empty tokens and adds them to a Set.
 * Avoids intermediate array allocations from split().filter().
 */
function addClassTokens(target: Set<string>, className: string): void {
	let start = 0;
	const len = className.length;
	for (let i = 0; i <= len; i++) {
		if (i === len || className.charCodeAt(i) === 32) { // 32 = ' '
			if (i > start) {
				target.add(className.substring(start, i));
			}
			start = i + 1;
		}
	}
}

/**
 * Joins a Set of class names into a single string.
 */
function joinClasses(classes: Set<string>): string {
	let result = '';
	for (const cls of classes) {
		if (result) result += ' ';
		result += cls;
	}
	return result;
}

// Mark element as having a reactive className and capture static classes
export function initReactiveClassName(el: HTMLElement): void {
	if (!(el as any)[STATIC_CLASSNAME_KEY]) {
		const classSet = new Set<string>();
		if (el.className) addClassTokens(classSet, el.className);
		(el as any)[STATIC_CLASSNAME_KEY] = classSet;
	}
	(el as any)[REACTIVE_CLASSNAME_KEY] = true;
}

// Check if element has a reactive className
export function hasReactiveClassName(el: HTMLElement): boolean {
	return !!(el as any)[REACTIVE_CLASSNAME_KEY];
}

// Get static classes set for the element
function getStaticClasses(el: HTMLElement): Set<string> {
	return (el as any)[STATIC_CLASSNAME_KEY] as Set<string>;
}

// Add static classes to the element
export function addStaticClasses(el: HTMLElement, className: string): void {
	if (!className) return;

	if (!(el as any)[STATIC_CLASSNAME_KEY]) {
		(el as any)[STATIC_CLASSNAME_KEY] = new Set();
	}

	addClassTokens((el as any)[STATIC_CLASSNAME_KEY] as Set<string>, className);
}

// Merge reactive className with static classes
export function mergeReactiveClassName(el: HTMLElement, reactiveClassName: string): void {
	const staticClasses = getStaticClasses(el);

	if (staticClasses && staticClasses.size > 0 && reactiveClassName) {
		const allClasses = new Set(staticClasses);
		addClassTokens(allClasses, reactiveClassName);
		el.className = joinClasses(allClasses);
	} else if (reactiveClassName) {
		el.className = reactiveClassName;
	} else if (staticClasses && staticClasses.size > 0) {
		el.className = joinClasses(staticClasses);
	} else {
		el.className = '';
	}
}

// Merge static className (for non-reactive className attributes)
export function mergeStaticClassName(el: HTMLElement, newClassName: string): void {
	if (!newClassName) return;

	const currentClassName = el.className;

	if (currentClassName && currentClassName !== newClassName) {
		const existing = new Set<string>();
		addClassTokens(existing, currentClassName);
		addClassTokens(existing, newClassName);
		el.className = joinClasses(existing);
	} else {
		el.className = newClassName;
	}
}
