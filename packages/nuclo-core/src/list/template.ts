/**
 * Row-template cloning for list().
 *
 * Building a row through the normal pipeline costs one createElement + a full
 * modifier pass per element. For a keyed list every row comes from the same
 * render function, so the structure is identical across rows and only the
 * leaves differ (text values, event handlers, reactive resolvers, and —
 * rarely — static attribute values). This module:
 *
 *  1. analyzes the first row's factory tree (via the internal factory
 *     metadata symbols) and, when every modifier falls into a supported
 *     shape, records a slot program for the row;
 *  2. clones the first row's built element as a skeleton (cloneNode does not
 *     copy property-assigned `on*` handlers or reactive registrations, and
 *     reactive classNames are scrubbed so a selected first row can't leak
 *     its state into the skeleton);
 *  3. builds every other row as skeleton.cloneNode(true) + a patch pass that
 *     walks the new factory tree in lockstep with the slot program.
 *
 * Any construct outside the supported shape (style objects, on() modifiers,
 * nested list()/when(), node children, resolvers returning non-primitives,
 * multiple className sources per element, SVG) bails to the normal build
 * path — the template is per-list state, so unsupported lists simply never
 * activate it. A per-row shape mismatch (heterogeneous render output)
 * deactivates the template for that list and rebuilds the row normally.
 */

import { getFactoryMods, getFactoryTag } from "../element/factory-meta";
import { isNode } from "../shared/type-guards";

export const LEAF_TEXT = 0;
export const LEAF_CLASSNAME = 1;

/**
 * A clone's dynamic leaf, owned by its list record instead of the global
 * reactive registries: template rows have a known lifetime (they live and die
 * with their record), so update() can flush them with a tight array walk —
 * no WeakRef/WeakMap bookkeeping per row, nothing for the GC sweeps to prune.
 */
export interface RowLeaf {
  kind: number;
  node: Text | HTMLElement;
  fn: () => unknown;
  last: string;
}

export const SLOT_ATTRS = 0;
export const SLOT_TEXT = 1;
export const SLOT_REACTIVE_TEXT = 2;
export const SLOT_CHILD = 3;
export const SLOT_NULL = 4;

export const ATTR_STATIC = 0;
export const ATTR_EVENT = 1;
export const ATTR_REACTIVE_CLASSNAME = 2;
export const ATTR_NULL = 3;

export interface AttrSpec {
  key: string;
  kind: number;
  /** Static attrs: element exposes the key as a property (filled from the skeleton). */
  prop: boolean;
}

export type TemplateSlot =
  | { kind: typeof SLOT_ATTRS; keys: AttrSpec[] }
  | { kind: typeof SLOT_TEXT }
  | { kind: typeof SLOT_REACTIVE_TEXT }
  | { kind: typeof SLOT_CHILD; child: TemplateNode }
  | { kind: typeof SLOT_NULL };

export interface TemplateNode {
  tag: string;
  slots: TemplateSlot[];
}

export interface ListTemplate {
  tmpl: TemplateNode;
  skeleton: Element;
}

function isOnKey(key: string): boolean {
  return key.charCodeAt(0) === 111 /* o */ && key.charCodeAt(1) === 110 /* n */;
}

/**
 * Classifies a factory's modifier tree into a slot program, or returns null
 * when any modifier falls outside the supported shape.
 */
export function analyzeFactory(tag: string, mods: readonly unknown[]): TemplateNode | null {
  const slots: TemplateSlot[] = [];
  let classNameSources = 0;

  for (let i = 0; i < mods.length; i++) {
    const mod = mods[i];
    if (mod == null) {
      slots.push({ kind: SLOT_NULL });
      continue;
    }
    const t = typeof mod;

    if (t === "function") {
      const childMods = getFactoryMods(mod);
      if (childMods !== undefined) {
        const childTag = getFactoryTag(mod);
        if (!childTag) return null;
        const child = analyzeFactory(childTag, childMods);
        if (!child) return null;
        slots.push({ kind: SLOT_CHILD, child });
        continue;
      }
      if ((mod as () => unknown).length === 0) {
        // Probe once to confirm this is a text resolver. cn()-style objects,
        // nodes and nested builders are handled by the normal path only.
        let v: unknown;
        try {
          v = (mod as () => unknown)();
        } catch {
          return null;
        }
        if (v == null || (typeof v !== "object" && typeof v !== "function")) {
          slots.push({ kind: SLOT_REACTIVE_TEXT });
          continue;
        }
        return null;
      }
      // on() modifiers, when()/list() blocks, arbitrary NodeModFns.
      return null;
    }

    if (t === "object") {
      if (isNode(mod)) return null;
      const attrs = mod as Record<string, unknown>;
      const keys = Object.keys(attrs);
      const specs: AttrSpec[] = [];
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const v = attrs[key];
        if (v == null) {
          specs.push({ key, kind: ATTR_NULL, prop: false });
          continue;
        }
        if (key === "style") return null;
        const vt = typeof v;
        if (vt === "function") {
          if (isOnKey(key)) {
            specs.push({ key, kind: ATTR_EVENT, prop: false });
            continue;
          }
          if (key === "className" && (v as () => unknown).length === 0) {
            if (classNameSources++) return null;
            specs.push({ key, kind: ATTR_REACTIVE_CLASSNAME, prop: false });
            continue;
          }
          // Reactive non-className attributes need skeleton scrubbing per
          // key to stay correct — not worth it; normal path handles them.
          return null;
        }
        if (vt === "object") return null;
        if (key === "className" && classNameSources++) return null;
        specs.push({ key, kind: ATTR_STATIC, prop: false });
      }
      slots.push({ kind: SLOT_ATTRS, keys: specs });
      continue;
    }

    // string | number | boolean → static text child
    slots.push({ kind: SLOT_TEXT });
  }

  return { tag, slots };
}

/**
 * One-time skeleton pass: fills each static attr's property-vs-attribute
 * flag and scrubs reactive classNames (the first row may have rendered with
 * row-specific state, e.g. a selected row's "danger" class).
 */
export function prepareSkeleton(tmpl: TemplateNode, skeleton: Element): void {
  const slots = tmpl.slots;
  let child: Node | null = skeleton.firstChild;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    switch (slot.kind) {
      case SLOT_ATTRS: {
        const specs = slot.keys;
        for (let k = 0; k < specs.length; k++) {
          const spec = specs[k];
          if (spec.kind === ATTR_STATIC) {
            spec.prop = spec.key in skeleton;
          } else if (spec.kind === ATTR_REACTIVE_CLASSNAME) {
            (skeleton as HTMLElement).className = "";
          }
        }
        break;
      }
      case SLOT_TEXT:
      case SLOT_REACTIVE_TEXT:
        child = child && child.nextSibling;
        break;
      case SLOT_CHILD:
        if (!child) return;
        prepareSkeleton(slot.child, child as Element);
        child = child.nextSibling;
        break;
      // SLOT_NULL: no node produced
    }
  }
}

/**
 * Patches a skeleton clone from a fresh factory tree. Returns false on any
 * shape mismatch — the caller then rebuilds the row through the normal path
 * (a partially patched clone is safe to abandon: its reactive registrations
 * are weak and disconnected, so the next update() sweeps them).
 */
export function instantiateTemplate(
  tmpl: TemplateNode,
  mods: readonly unknown[],
  el: Element,
  leaves: RowLeaf[],
): boolean {
  const slots = tmpl.slots;
  if (mods.length !== slots.length) return false;
  let child: Node | null = el.firstChild;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const mod = mods[i];

    switch (slot.kind) {
      case SLOT_ATTRS: {
        if (mod == null || typeof mod !== "object") return false;
        const attrs = mod as Record<string, unknown>;
        const specs = slot.keys;
        // Allocation-free exact-shape walk: same-literal objects enumerate in
        // insertion order, so keys must match the specs pairwise.
        let k = 0;
        for (const key in attrs) {
          if (k >= specs.length) return false;
          const spec = specs[k];
          if (spec.key !== key) return false;
          k++;
          const v = attrs[key];
          switch (spec.kind) {
            case ATTR_STATIC: {
              if (v == null || typeof v === "object" || typeof v === "function") return false;
              if (spec.prop) {
                const target = el as unknown as Record<string, unknown>;
                if (target[spec.key] !== v) target[spec.key] = v;
              } else {
                const s = String(v);
                if (el.getAttribute(spec.key) !== s) el.setAttribute(spec.key, s);
              }
              break;
            }
            case ATTR_EVENT: {
              if (typeof v !== "function") return false;
              (el as unknown as Record<string, unknown>)[spec.key] = v;
              break;
            }
            case ATTR_REACTIVE_CLASSNAME: {
              if (typeof v !== "function" || (v as () => unknown).length !== 0) return false;
              // Single-source reactive className (analysis bails on mixed
              // static+reactive), and the skeleton is scrubbed to "" — so a
              // plain className assignment is exact, no merge needed.
              const fn = v as () => unknown;
              let resolved: unknown;
              try {
                resolved = fn();
              } catch {
                return false;
              }
              const s = resolved ? String(resolved) : "";
              if (s) (el as HTMLElement).className = s;
              leaves.push({ kind: LEAF_CLASSNAME, node: el as HTMLElement, fn, last: s });
              break;
            }
            case ATTR_NULL: {
              if (v != null) return false;
              break;
            }
          }
        }
        if (k !== specs.length) return false;
        break;
      }

      case SLOT_TEXT: {
        if (mod == null || typeof mod === "object" || typeof mod === "function") return false;
        if (!child) return false;
        (child as Text).nodeValue = String(mod);
        child = child.nextSibling;
        break;
      }

      case SLOT_REACTIVE_TEXT: {
        if (typeof mod !== "function" || (mod as () => unknown).length !== 0) return false;
        if (getFactoryMods(mod) !== undefined) return false;
        if (!child) return false;
        let v: unknown;
        try {
          v = (mod as () => unknown)();
        } catch {
          return false;
        }
        if (v != null && (typeof v === "object" || typeof v === "function")) return false;
        const s = v == null ? "" : String(v);
        const textNode = child as Text;
        textNode.nodeValue = s;
        leaves.push({ kind: LEAF_TEXT, node: textNode, fn: mod as () => unknown, last: s });
        child = textNode.nextSibling;
        break;
      }

      case SLOT_CHILD: {
        const childMods = getFactoryMods(mod);
        if (childMods === undefined) return false;
        if (getFactoryTag(mod) !== slot.child.tag) return false;
        if (!child) return false;
        if (!instantiateTemplate(slot.child, childMods, child as Element, leaves)) return false;
        child = child.nextSibling;
        break;
      }

      case SLOT_NULL: {
        if (mod != null) return false;
        break;
      }
    }
  }
  return true;
}

/**
 * Flushes a template row's dynamic leaves: re-evaluates each resolver and
 * writes the DOM only on change. Resolver errors leave the previous value in
 * place (matching the notify passes' error tolerance).
 */
export function flushRowLeaves(leaves: RowLeaf[]): void {
  for (let i = 0; i < leaves.length; i++) {
    const leaf = leaves[i];
    let v: unknown;
    try {
      v = leaf.fn();
    } catch {
      continue;
    }
    if (leaf.kind === LEAF_TEXT) {
      const s = v == null || typeof v === "object" || typeof v === "function" ? "" : String(v);
      if (s !== leaf.last) {
        (leaf.node as Text).nodeValue = s;
        leaf.last = s;
      }
    } else {
      const s = v ? String(v) : "";
      if (s !== leaf.last) {
        (leaf.node as HTMLElement).className = s;
        leaf.last = s;
      }
    }
  }
}
