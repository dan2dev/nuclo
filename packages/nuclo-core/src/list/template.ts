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
 * on() modifiers for native DOM events are supported: they only attach a
 * listener to their parent, so each clone replays them exactly as the normal
 * build would (cloneNode never copies addEventListener listeners, so the
 * skeleton itself stays listener-free).
 *
 * Any construct outside the supported shape (style objects, on("mount") /
 * on("destroy") and other arbitrary NodeModFns, nested list()/when(), node
 * children, resolvers returning non-primitives, the same attribute key set by
 * two attribute objects of one element, SVG) bails to the normal build path —
 * the template is per-list state, so unsupported lists simply never activate
 * it. A per-row shape mismatch (heterogeneous render output) deactivates the
 * template for that list and rebuilds the row normally.
 */

import { getFactoryMods, getFactoryTag, isEventModifier } from "../element/factory-meta";
import { eventAttributeToProperty, setEventAttribute } from "../element/event-attributes";
import { removeAllListeners } from "../element/events";
import { isNode } from "../shared/type-guards";
import { cleanupReactiveElement, cleanupReactiveTextNode } from "../update/registry";
import { toText } from "../update/reactive-text";

export const LEAF_TEXT = 0;
export const LEAF_CLASSNAME = 1;

/** Array slots per leaf in RowLeaves: kind, node, resolver, last value. */
export const LEAF_STRIDE = 4;

/**
 * A clone's dynamic leaves, owned by its list record instead of the global
 * reactive registries: template rows have a known lifetime (they live and die
 * with their record), so update() can flush them with a tight array walk —
 * no WeakRef/WeakMap bookkeeping per row, nothing for the GC sweeps to prune.
 *
 * Stored flat — [kind, node, fn, last, kind, node, fn, last, ...] — rather
 * than as one object per leaf: a row costs a single small array instead of an
 * array plus an object per leaf, which is the bulk of a template row's
 * retained bookkeeping and allocation.
 */
export type RowLeaves = unknown[];

export const SLOT_ATTRS = 0;
export const SLOT_TEXT = 1;
export const SLOT_REACTIVE_TEXT = 2;
export const SLOT_CHILD = 3;
export const SLOT_NULL = 4;
export const SLOT_EVENT = 5;

export const ATTR_STATIC = 0;
export const ATTR_EVENT = 1;
export const ATTR_REACTIVE_CLASSNAME = 2;
export const ATTR_NULL = 3;

export interface AttrSpec {
  key: string;
  kind: number;
  /** Static attrs: element exposes the key as a property (filled from the skeleton). */
  prop: boolean;
  /**
   * Static attrs: a skeleton clone already carries the first-row value, so a
   * row with that same value needs no write. False for state cloneNode() does
   * not copy (e.g. a <select>'s value) — those rows always write.
   */
  cloned: boolean;
  /** Static attrs: first-row value. Events: normalized native property name. Else undefined (one shape for every spec). */
  value: unknown;
}

/**
 * One object shape for every slot (unused fields null) so `slot.kind` reads
 * stay monomorphic in the per-row patch loop; a union of shapes made that
 * property access polymorphic for every slot of every row.
 */
export interface TemplateSlot {
  kind: number;
  /** SLOT_ATTRS only. */
  keys: AttrSpec[] | null;
  /** SLOT_CHILD only. */
  child: TemplateNode | null;
}

function slot(kind: number, keys: AttrSpec[] | null = null, child: TemplateNode | null = null): TemplateSlot {
  return { kind, keys, child };
}

export interface TemplateNode {
  tag: string;
  slots: TemplateSlot[];
  /** This element carries event handlers (an on() modifier or an `on*` attribute). */
  events: boolean;
  /** Any element in this subtree (itself included) carries event handlers. */
  subtreeEvents: boolean;
  /**
   * Native IDL handler properties (`onclick`, ...) this element's `on*`
   * attributes set. Filled by prepareSkeleton(). Clones assign these
   * directly — no per-element bookkeeping, the slot program is the record of
   * what to release — and cleanup nulls them.
   */
  eventProps: string[] | null;
  /** Slots a row's RowLeaves array needs (LEAF_STRIDE per dynamic leaf, subtree included). */
  leafCount: number;
  /**
   * Handlers that went through addEventListener (on() modifiers, or an `on*`
   * attribute the element has no IDL property for) and are tracked per
   * element; cleanup releases them with removeAllListeners().
   */
  tracked: boolean;
}

/**
 * Shared leaves of a template row that has none. Every template-built row
 * gets a non-null `dyn`, which is how the cleanup paths tell it from a row
 * built normally (whose subtree may hold registrations the template never
 * produces).
 */
export const NO_LEAVES: RowLeaves = [];

/**
 * Write cursor into the row being patched. A template knows its leaf count,
 * so each row gets an exact-size array written by index — no shared scratch
 * buffer to push into and slice out of. A resolver probed mid-row may render
 * a nested list, which opens rows of its own: callers save the cursor with
 * leafCursor() before openLeaves() and put it back after the row.
 */
let leafPos = 0;

export function leafCursor() {
  return leafPos;
}

export function restoreLeafCursor(pos: number) {
  leafPos = pos;
}

export function openLeaves(tmpl: TemplateNode): RowLeaves {
  leafPos = 0;
  return tmpl.leafCount === 0 ? NO_LEAVES : new Array<unknown>(tmpl.leafCount);
}

function putLeaf(leaves: RowLeaves, kind: number, node: Node, fn: unknown, last: string) {
  leaves[leafPos] = kind;
  leaves[leafPos + 1] = node;
  leaves[leafPos + 2] = fn;
  leaves[leafPos + 3] = last;
  leafPos += LEAF_STRIDE;
}

export interface ListTemplate {
  tmpl: TemplateNode;
  skeleton: Element;
}

/** True when an earlier attribute object of the same element already sets `key`. */
function setsAttribute(slots: readonly TemplateSlot[], key: string) {
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (slot.kind !== SLOT_ATTRS) continue;
    for (let k = 0; k < slot.keys!.length; k++) {
      if (slot.keys![k].key === key && slot.keys![k].kind !== ATTR_NULL) return true;
    }
  }
  return false;
}

/**
 * Classifies a factory's modifier tree into a slot program, or returns null
 * when any modifier falls outside the supported shape.
 */
export function analyzeFactory(tag: string, mods: readonly unknown[]): TemplateNode | null {
  const slots: TemplateSlot[] = [];

  for (let i = 0; i < mods.length; i++) {
    const mod = mods[i];
    if (mod == null) {
      slots.push(slot(SLOT_NULL));
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
        slots.push(slot(SLOT_CHILD, null, child));
        continue;
      }
      if ((mod as () => unknown).length === 0) {
        // Probe once to confirm this is a text resolver. className-object
        // results (css()/cx()), nodes and nested builders are handled by the
        // normal path only.
        let v: unknown;
        try {
          v = (mod as () => unknown)();
        } catch {
          return null;
        }
        if (v == null || (typeof v !== "object" && typeof v !== "function")) {
          slots.push(slot(SLOT_REACTIVE_TEXT));
          continue;
        }
        return null;
      }
      if (isEventModifier(mod)) {
        slots.push(slot(SLOT_EVENT));
        continue;
      }
      // on("mount"/"destroy"), when()/list() blocks, arbitrary NodeModFns.
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
          specs.push({ key, kind: ATTR_NULL, prop: false, cloned: false, value: undefined });
          continue;
        }
        if (key === "style") return null;
        // The same key set by two attribute objects (className merging, or a
        // plain "last one wins" attribute): patching a clone slot by slot
        // can't replay that — a later slot whose value equals its first-row
        // value is skipped, leaving an earlier slot's row value in place.
        if (setsAttribute(slots, key)) return null;
        const vt = typeof v;
        if (vt === "function") {
          const eventProperty = eventAttributeToProperty(key);
          if (eventProperty) {
            specs.push({ key, kind: ATTR_EVENT, prop: false, cloned: false, value: eventProperty });
            continue;
          }
          if (key === "className" && (v as () => unknown).length === 0) {
            specs.push({ key, kind: ATTR_REACTIVE_CLASSNAME, prop: false, cloned: false, value: undefined });
            continue;
          }
          // Reactive non-className attributes need skeleton scrubbing per
          // key to stay correct — not worth it; normal path handles them.
          return null;
        }
        if (vt === "object") return null;
        specs.push({ key, kind: ATTR_STATIC, prop: false, cloned: false, value: v });
      }
      slots.push(slot(SLOT_ATTRS, specs));
      continue;
    }

    // string | number | boolean → static text child
    slots.push(slot(SLOT_TEXT));
  }

  let events = false;
  let subtreeEvents = false;
  let leafCount = 0;
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (s.kind === SLOT_EVENT) events = true;
    else if (s.kind === SLOT_REACTIVE_TEXT) leafCount += LEAF_STRIDE;
    else if (s.kind === SLOT_CHILD) {
      subtreeEvents ||= s.child!.subtreeEvents;
      leafCount += s.child!.leafCount;
    } else if (s.kind === SLOT_ATTRS) {
      for (let k = 0; k < s.keys!.length; k++) {
        if (s.keys![k].kind === ATTR_EVENT) events = true;
        else if (s.keys![k].kind === ATTR_REACTIVE_CLASSNAME) leafCount += LEAF_STRIDE;
      }
    }
  }
  // `tracked` starts conservative; prepareSkeleton() narrows it.
  return { tag, slots, events, subtreeEvents: events || subtreeEvents, eventProps: null, tracked: events, leafCount };
}

/**
 * Releases a template row's event handlers before its DOM is dropped — the
 * only bookkeeping a template row holds outside its record. Its reactive
 * leaves are record-owned, and analysis bails on lifecycle hooks, nested
 * blocks and anything else cleanupNodeTree() would have to visit, so the
 * walk follows the slot program straight to the event-carrying elements and
 * skips every subtree without one — instead of a WeakMap probe per node.
 */
export function cleanupTemplateRow(tmpl: TemplateNode, el: Element) {
  if (!tmpl.subtreeEvents) return;
  const props = tmpl.eventProps;
  if (props !== null) {
    const target = el as unknown as Record<string, unknown>;
    // A clone's handler is whatever the row set; nothing else of nuclo's
    // writes these properties on a template row.
    for (let i = 0; i < props.length; i++) if (typeof target[props[i]] === "function") target[props[i]] = null;
  }
  if (tmpl.tracked) removeAllListeners(el as HTMLElement);
  const slots = tmpl.slots;
  let child: Node | null = el.firstChild;
  for (let i = 0; i < slots.length && child !== null; i++) {
    const slot = slots[i];
    switch (slot.kind) {
      case SLOT_TEXT:
      case SLOT_REACTIVE_TEXT:
        child = child.nextSibling;
        break;
      case SLOT_CHILD:
        if (slot.child!.subtreeEvents) cleanupTemplateRow(slot.child!, child as Element);
        child = child.nextSibling;
        break;
      // SLOT_ATTRS / SLOT_NULL / SLOT_EVENT: no node produced
    }
  }
}

/**
 * One-time skeleton pass: fills each static attr's property-vs-attribute
 * flag and scrubs reactive classNames (the first row may have rendered with
 * row-specific state, e.g. a selected row's "danger" class).
 */
export function prepareSkeleton(tmpl: TemplateNode, skeleton: Element) {
  const slots = tmpl.slots;
  let child: Node | null = skeleton.firstChild;
  let tracked = false;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    switch (slot.kind) {
      case SLOT_EVENT:
        tracked = true;
        break;
      case SLOT_ATTRS: {
        const specs = slot.keys!;
        for (let k = 0; k < specs.length; k++) {
          const spec = specs[k];
          if (spec.kind === ATTR_EVENT) {
            spec.prop = (spec.value as string) in skeleton;
            if (spec.prop) (tmpl.eventProps ??= []).push(spec.value as string);
            else tracked = true;
          } else if (spec.kind === ATTR_STATIC) {
            spec.prop = spec.key in skeleton;
            spec.cloned = spec.prop
              ? (skeleton as unknown as Record<string, unknown>)[spec.key] === spec.value
              : skeleton.getAttribute(spec.key) === String(spec.value);
          } else if (spec.kind === ATTR_REACTIVE_CLASSNAME) {
            // Drop the attribute rather than assigning "": className = ""
            // leaves an empty class="" that every clone would copy — per-row
            // attribute storage and style work the normal build never has.
            // The reactive resolver is this element's only class source, and
            // clones only write className when it resolves non-empty.
            skeleton.removeAttribute("class");
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
        prepareSkeleton(slot.child!, child as Element);
        child = child.nextSibling;
        break;
      // SLOT_NULL: no node produced
    }
  }
  tmpl.tracked = tracked;
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
  leaves: RowLeaves,
) {
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
        const specs = slot.keys!;
        let attrCount = 0;
        for (const _k in attrs) attrCount++;
        if (attrCount !== specs.length) return false;
        for (let k = 0; k < specs.length; k++) {
          const spec = specs[k];
          const v = attrs[spec.key];
          switch (spec.kind) {
            case ATTR_STATIC: {
              if (v == null || typeof v === "object" || typeof v === "function") return false;
              if (v === spec.value && spec.cloned) break;
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
              const eventProperty = spec.value as string;
              // Fresh clone, known property: a plain assignment. The slot
              // program (eventProps) is what cleanup consults, so no
              // per-element handler bookkeeping is needed.
              if (spec.prop) (el as unknown as Record<string, unknown>)[eventProperty] = v;
              else setEventAttribute(el as HTMLElement, eventProperty, v as EventListener);
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
              putLeaf(leaves, LEAF_CLASSNAME, el, fn, s);
              break;
            }
            case ATTR_NULL: {
              // The key must be there and nullish: a row whose object has a
              // different key in its place also reads as undefined here, and
              // would otherwise lose that attribute.
              if (v != null || !(spec.key in attrs)) return false;
              break;
            }
          }
        }
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
        const s = toText(v);
        const textNode = child as Text;
        textNode.nodeValue = s;
        putLeaf(leaves, LEAF_TEXT, textNode, mod, s);
        child = textNode.nextSibling;
        break;
      }

      case SLOT_CHILD: {
        const childMods = getFactoryMods(mod);
        if (childMods === undefined) return false;
        if (getFactoryTag(mod) !== slot.child!.tag) return false;
        if (!child) return false;
        if (!instantiateTemplate(slot.child!, childMods, child as Element, leaves)) return false;
        child = child.nextSibling;
        break;
      }

      case SLOT_NULL: {
        if (mod != null) return false;
        break;
      }

      case SLOT_EVENT: {
        if (!isEventModifier(mod)) return false;
        // Same call the normal build makes (applyNodeModifier): attaches and
        // tracks this row's listener on the clone. Produces no node.
        (mod as (parent: Element, index: number) => void)(el, 0);
        break;
      }
    }
  }
  return true;
}

/**
 * Converts the normally-built first row of a compatible template into the same
 * record-owned dynamic leaf representation used by skeleton clones.
 *
 * The normal builder has already registered reactive text/className leaves in
 * the global registries. Template rows have a tighter lifetime through their
 * list record, so unregister those first-row leaves and let updateListRuntimes()
 * flush them with the rest of the templated rows.
 */
export function adoptTemplateLeaves(
  tmpl: TemplateNode,
  mods: readonly unknown[],
  el: Element,
  leaves: RowLeaves,
) {
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
        const specs = slot.keys!;
        let k = 0;
        for (const key in attrs) {
          if (k >= specs.length) return false;
          const spec = specs[k];
          if (spec.key !== key) return false;
          k++;
          const v = attrs[key];
          if (spec.kind === ATTR_REACTIVE_CLASSNAME) {
            if (typeof v !== "function" || (v as () => unknown).length !== 0) return false;
            cleanupReactiveElement(el);
            putLeaf(leaves, LEAF_CLASSNAME, el, v, (el as HTMLElement).className);
          }
        }
        if (k !== specs.length) return false;
        break;
      }

      case SLOT_TEXT:
        if (!child) return false;
        child = child.nextSibling;
        break;

      case SLOT_REACTIVE_TEXT: {
        if (typeof mod !== "function" || (mod as () => unknown).length !== 0) return false;
        if (!child || child.nodeType !== 3) return false;
        const textNode = child as Text;
        cleanupReactiveTextNode(textNode);
        putLeaf(leaves, LEAF_TEXT, textNode, mod, textNode.nodeValue ?? "");
        child = textNode.nextSibling;
        break;
      }

      case SLOT_CHILD: {
        const childMods = getFactoryMods(mod);
        if (childMods === undefined) return false;
        if (getFactoryTag(mod) !== slot.child!.tag) return false;
        if (!child) return false;
        if (!adoptTemplateLeaves(slot.child!, childMods, child as Element, leaves)) return false;
        child = child.nextSibling;
        break;
      }

      case SLOT_NULL:
        if (mod != null) return false;
        break;

      case SLOT_EVENT:
        // The normal build already attached this listener; nothing to adopt.
        if (!isEventModifier(mod)) return false;
        break;
    }
  }
  return true;
}

/**
 * Flushes a template row's dynamic leaves: re-evaluates each resolver and
 * writes the DOM only on change. Resolver errors leave the previous value in
 * place (matching the notify passes' error tolerance).
 */
export function flushRowLeaves(leaves: RowLeaves) {
  for (let i = 0; i < leaves.length; i += LEAF_STRIDE) {
    let v: unknown;
    try {
      v = (leaves[i + 2] as () => unknown)();
    } catch {
      continue;
    }
    if (leaves[i] === LEAF_TEXT) {
      const s = toText(v);
      if (s !== leaves[i + 3]) {
        (leaves[i + 1] as Text).nodeValue = s;
        leaves[i + 3] = s;
      }
    } else {
      const s = v ? String(v) : "";
      if (s !== leaves[i + 3]) {
        (leaves[i + 1] as HTMLElement).className = s;
        leaves[i + 3] = s;
      }
    }
  }
}
