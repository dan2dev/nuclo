const REACTIVE_CLASSNAME_KEY = '__nuclo_reactive_className__';
const STATIC_CLASSNAME_KEY = '__nuclo_static_className__';

// Mark element as having a reactive className and capture static classes
export function initReactiveClassName(el: HTMLElement): void {
	if (!(el as any)[STATIC_CLASSNAME_KEY]) {
		(el as any)[STATIC_CLASSNAME_KEY] = new Set(el.className.split(' ').filter(function(c) { return c; }));
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

	className.split(' ').filter(function(c) { return c; }).forEach(function(c) {
		((el as any)[STATIC_CLASSNAME_KEY] as Set<string>).add(c);
	});
}

// Merge reactive className with static classes
export function mergeReactiveClassName(el: HTMLElement, reactiveClassName: string): void {
	const staticClasses = getStaticClasses(el);

	// Combine static classes with reactive className
	if (staticClasses && staticClasses.size > 0 && reactiveClassName) {
		const allClasses = new Set(staticClasses);
		reactiveClassName.split(' ').filter(function(c) { return c; }).forEach(function(c) { allClasses.add(c); });
		el.className = Array.from(allClasses).join(' ');
	} else if (reactiveClassName) {
		el.className = reactiveClassName;
	} else if (staticClasses && staticClasses.size > 0) {
		el.className = Array.from(staticClasses).join(' ');
	} else {
		el.className = '';
	}
}

// Merge static className (for non-reactive className attributes)
export function mergeStaticClassName(el: HTMLElement, newClassName: string): void {
	if (!newClassName) return;

	const currentClassName = el.className;

	// If there's already a className, merge them (avoid duplicates)
	if (currentClassName && currentClassName !== newClassName) {
		const existing = new Set(currentClassName.split(' ').filter(function(c) { return c; }));
		const newClasses = newClassName.split(' ').filter(function(c) { return c; });
		newClasses.forEach(function(c) { existing.add(c); });
		el.className = Array.from(existing).join(' ');
	} else {
		el.className = newClassName;
	}
}
