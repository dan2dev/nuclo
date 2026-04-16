// WeakMap/WeakSet replace expando properties — zero `any`, automatic GC on element removal.
const staticClassNames = new WeakMap<HTMLElement, Set<string>>();
const reactiveClassNameFlags = new WeakSet<HTMLElement>();

// Track the last applied reactive className per element to skip redundant writes.
// WeakMap so entries disappear when elements are GCd.
const lastReactiveValue = new WeakMap<HTMLElement, string>();

/**
 * Splits a className string into tokens and adds them to a Set.
 * Single-pass via charCodeAt — avoids the intermediate array from split(' ').filter().
 */
function addClassTokens(target: Set<string>, className: string): void {
  const len = className.length;
  let start = 0;
  for (let i = 0; i <= len; i++) {
    if (i === len || className.charCodeAt(i) === 32 /* ' ' */) {
      if (i > start) target.add(className.substring(start, i));
      start = i + 1;
    }
  }
}

function joinClasses(classes: Set<string>): string {
  let result = "";
  for (const cls of classes) {
    if (result !== "") result += " ";
    result += cls;
  }
  return result;
}

export function initReactiveClassName(el: HTMLElement): void {
  if (!staticClassNames.has(el)) {
    const classSet = new Set<string>();
    if (el.className) addClassTokens(classSet, el.className);
    staticClassNames.set(el, classSet);
  }
  reactiveClassNameFlags.add(el);
}

export function hasReactiveClassName(el: HTMLElement): boolean {
  return reactiveClassNameFlags.has(el);
}

export function addStaticClasses(el: HTMLElement, className: string): void {
  if (!className) return;
  let classSet = staticClassNames.get(el);
  if (!classSet) {
    classSet = new Set<string>();
    staticClassNames.set(el, classSet);
  }
  addClassTokens(classSet, className);
  // Invalidate memo: static set changed, so next reactive merge must recompute.
  lastReactiveValue.delete(el);
}

/**
 * Merges a reactive className with the element's tracked static classes.
 * Fast-skips DOM writes when the incoming reactive string is unchanged.
 */
export function mergeReactiveClassName(
  el: HTMLElement,
  reactiveClassName: string,
): void {
  // Skip entirely if the resolver returned the same value we merged last time.
  if (lastReactiveValue.get(el) === reactiveClassName) return;
  lastReactiveValue.set(el, reactiveClassName);

  const staticClasses = staticClassNames.get(el);

  if (!staticClasses || staticClasses.size === 0) {
    el.className = reactiveClassName || "";
    return;
  }
  if (!reactiveClassName) {
    el.className = joinClasses(staticClasses);
    return;
  }

  // Hot path: merge static + reactive, deduping reactive tokens that already exist.
  let result = joinClasses(staticClasses);
  const len = reactiveClassName.length;
  let start = 0;
  for (let i = 0; i <= len; i++) {
    if (i === len || reactiveClassName.charCodeAt(i) === 32) {
      if (i > start) {
        const token = reactiveClassName.substring(start, i);
        if (!staticClasses.has(token)) result += " " + token;
      }
      start = i + 1;
    }
  }
  el.className = result;
}

export function mergeStaticClassName(
  el: HTMLElement,
  newClassName: string,
): void {
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
