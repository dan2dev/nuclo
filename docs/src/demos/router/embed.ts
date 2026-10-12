/**
 * Embedding support, nothing to do with routing itself: the examples page
 * shows this app in an iframe. An iframe shares the page's session history,
 * so the embedded copy keeps its own in-memory history instead, and it tells
 * the page where it is after every navigation. Opened standalone, none of
 * this runs and the browser's real history is used.
 */
export const embedded = new URLSearchParams(location.search).has("embed");

/** Swaps history for an in-memory stack: push and replace record, go() walks it and fires popstate. */
export function installMemoryHistory(): void {
  const h = window.history;
  const replace = h.replaceState.bind(h);
  const entries = [{ state: h.state as unknown, url: location.href }];
  let pos = 0;
  const at = (url: string | URL | null | undefined) => new URL(url ?? location.href, location.href).href;

  h.pushState = (state, _title, url) => {
    entries.splice(pos + 1);
    entries.push({ state, url: at(url) });
    pos++;
    replace(state, "", url);
  };
  h.replaceState = (state, _title, url) => {
    entries[pos] = { state, url: at(url) };
    replace(state, "", url);
  };
  h.go = (delta = 0) => {
    const next = pos + delta;
    if (!delta || next < 0 || next >= entries.length) return;
    pos = next;
    replace(entries[pos].state, "", entries[pos].url);
    setTimeout(() => dispatchEvent(new PopStateEvent("popstate", { state: entries[pos].state })));
  };
  h.back = () => h.go(-1);
  h.forward = () => h.go(1);
}

/** Tells the embedding page the app's current location, for its address bar. */
export function announce(kind: string): void {
  if (window.parent === window) return;
  const path = location.pathname.replace(/^\/demos\/router/, "") || "/";
  const query = new URLSearchParams(location.search);
  query.delete("embed"); // the page's own flag, not the app's
  const search = query.size ? `?${query}` : "";
  window.parent.postMessage({ type: "nuclo-router-demo", path: path + search, kind }, location.origin);
}

/** Follows the site's theme: it is stored in localStorage, which an iframe of the same origin shares. */
export function followTheme(): void {
  const apply = () => {
    const saved = localStorage.getItem("nuclo-theme");
    const theme = saved ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  };
  apply();
  addEventListener("storage", apply);
}
