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
import { forgetWindow, hooks, windowHeights, windowPlace } from "./dom";

let last = 0;
/** Rows this far past the visible part exist, in screens; the window moves when the visible part comes within one. */
const AHEAD = 3;

/**
 * `keys` are the whole list's ids; `item` gives a key's record, and a row is rebuilt when its record is another
 * object (as list() does); `render` builds a record's row. Rows are remembered by key.
 */
export function windowed<K, T>(keys: () => readonly K[], item: (key: K) => T, render: (item: T) => NodeModLike<"div">) {
  const id = String(++last);
  const heights = new Map<K, number>();
  let sum = 0;
  /** The keys the window was last placed in, to tell a list that only grew at its end from one that changed. */
  let all: readonly K[] = [];
  let length = 0;
  let first: K | undefined;
  /** The window: keys [from, to), with `top` px of rows before it and `end` px to its end. */
  let from = 0;
  let to = 0;
  let top = 0;
  let end = 0;
  let stale = true;
  let shown = false;

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
  /** The window's records, and the key of each. */
  const keyOf = new Map<T, K>();

  /** Places the window around the visible part. */
  function place() {
    const now = keys();
    const grew = now === all && now.length >= length && now[0] === first;
    if (grew && now.length === length && !stale) return;
    // Anything but growth at the end moves the rows before the window: counted again from the start.
    if (!grew) from = top = 0;
    [all, length, first, stale] = [now, now.length, now[0], false];
    const n = now.length;
    const at = windowPlace(id);
    if (at) shown = true;
    // Not laid out yet: the first rows, to have something to lay out.
    const [y, h] = at ?? [0, 0];
    const [lo, hi] = at ? [y - AHEAD * h, y + h + AHEAD * h] : [0, 0];
    from = Math.min(from, n);
    while (from < n && top + height(now[from]!) < lo) top += height(now[from++]!);
    while (from > 0 && top > lo) top -= height(now[--from]!);
    if (!from) top = 0;
    end = top;
    for (to = from; to < n && (at ? end < hi : to < 20); to++) end += height(now[to]!);
  }
  const rows = () => {
    place();
    keyOf.clear();
    return all.slice(from, to).map((key) => {
      const record = item(key);
      keyOf.set(record, key);
      return record;
    });
  };

  // After each layout: the heights the window's rows have.
  const laidOut = () => {
    windowHeights(id).forEach((h, i) => {
      const key = all[from + i];
      if (h === undefined || from + i >= to) return;
      sum += h - (heights.get(key!) ?? 0);
      heights.set(key!, h);
    });
    // Where the window ends, now that its rows have their real heights: follow() goes by it.
    end = top;
    for (let i = from; i < to; i++) end += height(all[i]!);
    follow();
  };
  // After each scroll and layout: the window moves once the visible part is within a screen of its end.
  const follow = () => {
    const at = windowPlace(id);
    if (at === null && shown) {
      // Its screen is gone.
      hooks.laidOut.delete(laidOut);
      hooks.scrolled.delete(follow);
      return forgetWindow(id);
    }
    if (!at) return;
    const [y, h] = at;
    if (!((from > 0 && y - h < top) || (to < all.length && y + 2 * h > end))) return;
    stale = true;
    update();
  };
  hooks.laidOut.add(laidOut);
  hooks.scrolled.add(follow);

  return div(
    // Padding (dom.ts lays these two out as it), not rows of their height: a far row is parked as it is, and would
    // not follow.
    {
      "data-window": id,
      "data-before": () => (place(), String(top)),
      "data-after": () => (place(), String((all.length - to) * mean())),
    },
    // A row says how tall it was (or is taken to be): it is parked at that until it comes near (dom.ts).
    list(rows, (record) => div({ "data-height": String(height(keyOf.get(record)!)) }, render(record))),
  );
}
