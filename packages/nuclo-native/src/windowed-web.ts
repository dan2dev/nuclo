/** windowed() on the web: every row is in the DOM, as with list(). The native build (windowed.ts) keeps a window. */
export const windowed = <K, T>(keys: () => readonly K[], item: (key: K) => T, render: (item: T) => NodeModLike<"div">) =>
  div(list(() => keys().map(item), (record) => div(render(record))));

/** flatList() on the web: every row is in the DOM, as with list(). */
export const flatList = <T>(items: () => readonly T[], render: (item: T) => NodeModLike<"div">) =>
  windowed(items, (item) => item, render);
