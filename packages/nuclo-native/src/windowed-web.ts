/** windowed() on the web: every row is in the DOM, as with list(). The native build (windowed.ts) keeps a window. */
export const windowed = <K, T>(keys: () => readonly K[], item: (key: K) => T, render: (item: T) => NodeModLike<"div">) =>
  div(list(() => keys().map(item), (record) => div(render(record))));

/** flatList() on the web: every row is in the DOM, as with list(). */
export const flatList = <T, K = T>(
  items: () => readonly T[],
  render: (item: T) => NodeModLike<"div">,
  keyOf?: (item: T) => K,
) => {
  if (!keyOf) return windowed(items, (item) => item, render);
  let rows = new Map<K, { item: T }>();
  return div(list(() => {
    const previous = rows;
    rows = new Map();
    return items().map((item) => {
      const key = keyOf(item);
      const old = rows.has(key) ? undefined : previous.get(key);
      const row = old && Object.is(old.item, item) ? old : { item };
      rows.set(key, row);
      return row;
    });
  }, (row) => div(render(row.item))));
};
