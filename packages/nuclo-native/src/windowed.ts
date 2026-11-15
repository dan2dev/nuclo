/**
 * list() for lists too long to keep: only the rows near what the screen shows exist, in JS as on the host. The rows
 * before and after them are the container's padding, so the content is as tall as if they were all there and nothing
 * moves as rows come and go. JS's memory then follows the window, not how far the user has scrolled.
 *
 * A row that leaves is remembered by its height alone; coming back, it is built again from its item. Rows before
 * the window count at the height they were laid out at, so what shows stays where it is; rows never laid out
 * (after it, or flung past) count at the mean, and take their place when they are.
 *
 * The web build (windowed-web.ts) keeps every row: the browser has its own ways.
 */
import { watchWindow, windowHeights, windowPlace } from "./dom";

let last = 0;
/** Rows this far past the visible part exist, in screens; the window moves when the visible part comes within one. */
const AHEAD = 3;

/**
 * `keys` are the whole list's ids; `item` gives a key's record, and a row is rebuilt when its record is another
 * object (as list() does); `render` builds a record's row. Rows are remembered by key.
 */
export function windowed<K, T>(keys: () => readonly K[], item: (key: K) => T, render: (item: T) => NodeModLike<"div">) {
  return virtualList(keys, (key) => key, item, render);
}

function virtualList<S, K, T>(
  source: () => readonly S[],
  keyOf: (value: S) => K,
  item: (value: S) => T,
  render: (item: T) => NodeModLike<"div">,
) {
  const id = String(++last);
  const heights = new Map<K, number>();
  // Check edits above the window on app updates without rescanning that prefix on a scroll update.
  const prefix: K[] = [];
  let sum = 0;
  let all: readonly S[] = [];
  let length = -1;
  /** The window: keys [from, to), with `top` px of rows before it and `end` px to its end. */
  let from = 0;
  let to = 0;
  let top = 0;
  let end = 0;
  let stale = true;
  let following = false;

  const mean = () => (heights.size ? sum / heights.size : 80);
  /** A row's height: as laid out, or the mean, which it then keeps until it is laid out: what is added before the window is taken off again. */
  const height = (key: K) => {
    let h = heights.get(key);
    if (h === undefined) {
      h = mean();
      heights.set(key, h);
      sum += h;
    }
    return h;
  };
  let entries = new Map<K, { key: K; record: T }>();
  const keyAt = (i: number) => keyOf(all[i]!);

  /** Places the window around the visible part. */
  function place(checkOrder: boolean) {
    all = source();
    const n = all.length;
    if (checkOrder && !following) {
      // The array may have been edited in place. Only keys before the window affect its offset.
      let i = 0;
      while (i < from && i < n && Object.is(prefix[i], keyAt(i))) i++;
      if (i !== from) {
        from = top = 0;
        stale = true;
      }
    }
    if (!stale && n === length) return;
    length = n;
    stale = false;
    const at = windowPlace(id);
    // Not laid out yet: the first rows, to have something to lay out.
    const [y, h] = at ?? [0, 0];
    const [lo, hi] = at ? [y - AHEAD * h, y + h + AHEAD * h] : [0, 0];
    while (from < n) {
      const key = keyAt(from);
      const h = height(key);
      if (top + h >= lo) break;
      prefix[from++] = key;
      top += h;
    }
    while (from > 0 && top > lo) top -= height(prefix[--from]!);
    prefix.length = from;
    if (!from) top = 0;
    end = top;
    for (to = from; to < n && (at ? end < hi : to < 20); to++) end += height(keyAt(to));
  }
  const rows = () => {
    place(true);
    const previous = entries;
    entries = new Map();
    const rows = [];
    for (let i = from; i < to; i++) {
      const key = keyAt(i);
      const record = item(all[i]!);
      const old = entries.has(key) ? undefined : previous.get(key);
      const entry = old && Object.is(old.record, record) ? old : { key, record };
      entries.set(key, entry);
      rows.push(entry);
    }
    return rows;
  };

  // After each layout: the heights the window's rows have.
  const laidOut = () => {
    windowHeights(id).forEach((h, i) => {
      if (h === undefined || from + i >= to) return;
      const key = keyAt(from + i);
      sum += h - (heights.get(key) ?? 0);
      heights.set(key, h);
    });
    // Where the window ends, now that its rows have their real heights: follow() goes by it.
    end = top;
    for (let i = from; i < to; i++) end += height(keyAt(i));
    follow();
  };
  // After each scroll and layout: the window moves once the visible part is within a screen of its end.
  const follow = () => {
    const at = windowPlace(id);
    if (!at) return;
    const [y, h] = at;
    if (h <= 0) return;
    if (!((from > 0 && y - h < top) || (to < all.length && y + 2 * h > end))) return;
    stale = true;
    following = true;
    try {
      update();
    } finally {
      following = false;
    }
  };

  return div(
    // Padding (dom.ts lays these two out as it), not rows of their height: a far row is parked as it is, and would
    // not follow.
    {
      "data-window": id,
      onMount: (element) => watchWindow(element, id, follow, laidOut),
      "data-before": () => (place(false), String(top)),
      "data-after": () => (place(false), String((all.length - to) * mean())),
    },
    // A row says how tall it was (or is taken to be): it is parked at that until it comes near (dom.ts).
    list(rows, ({ key, record }) => div({ "data-height": String(height(key)) }, render(record))),
  );
}

/**
 * list() for a long list, called the same way: `flatList(() => people, personRow)`. Only the rows near the screen
 * exist, in JS as on the host (windowed, with each item its own key), so a thousand items that arrive together cost
 * a few screens of rows. Keep list() for short lists: its rows are their container's own children and all exist.
 * Here they are the children of the list's own view, so the container's `gap` does not reach them: give the rows a
 * margin.
 */
export const flatList = <T, K = T>(
  items: () => readonly T[],
  render: (item: T) => NodeModLike<"div">,
  keyOf?: (item: T) => K,
) => virtualList(items, (item): T | K => keyOf ? keyOf(item) : item, (item) => item, render);
