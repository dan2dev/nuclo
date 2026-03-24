// WeakMap/WeakSet replace expando properties — zero `any`, automatic GC on element removal.
const staticClassNames = new WeakMap<HTMLElement, Set<string>>();
const reactiveClassNameFlags = new WeakSet<HTMLElement>();

/**
 * Splits a className string into non-empty tokens and adds them to a Set.
 * Single-pass via charCodeAt — avoids intermediate array from split().filter().
 */
function addClassTokens(target: Set<string>, className: string): void {
	const len = className.length;
	let start = 0;
	for (let i = 0; i <= len; i++) {
		if (i === len || className.charCodeAt(i) === 32) { // 32 = ' '
			if (i > start) target.add(className.substring(start, i));
			start = i + 1;
		}
	}
}

/**
 * Joins a Set of class names into a single space-separated string.
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
	if (!staticClassNames.has(el)) {
		const classSet = new Set<string>();
		if (el.className) addClassTokens(classSet, el.className);
		staticClassNames.set(el, classSet);
	}
	reactiveClassNameFlags.add(el);
}

// Check if element has a reactive className
export function hasReactiveClassName(el: HTMLElement): boolean {
	return reactiveClassNameFlags.has(el);
}

// Add static classes to the element's tracked set
export function addStaticClasses(el: HTMLElement, className: string): void {
	if (!className) return;
	let classSet = staticClassNames.get(el);
	if (!classSet) {
		classSet = new Set<string>();
		staticClassNames.set(el, classSet);
	}
	addClassTokens(classSet, className);
}

// Merge reactive className with static classes — called on every reactive update
export function mergeReactiveClassName(el: HTMLElement, reactiveClassName: string): void {
	const staticClasses = staticClassNames.get(el);

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
