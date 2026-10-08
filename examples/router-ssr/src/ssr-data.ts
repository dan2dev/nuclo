/**
 * The server → client data handoff.
 *
 * A loader runs on both sides, so without this the browser would fetch, on
 * hydration, exactly what the server already put in the HTML. The server
 * serializes `route.data` into a script tag; the first loader to ask for it in
 * the browser takes it and the slot is emptied, so later navigations fetch
 * normally.
 */
declare global {
  interface Window {
    __ROUTE_DATA__?: unknown;
  }
}

/** Server side: the script tag to drop into the document. */
export function serializeRouteData(data: unknown): string {
  if (data === undefined) return "";
  // </script> inside the JSON would end the tag early.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<script>window.__ROUTE_DATA__=${json}</script>`;
}

/**
 * Browser side: the server's data for this page, exactly once. Returns
 * undefined on a client-side navigation, which is the signal to fetch.
 */
export function takeServerData<T>(): T | undefined {
  if (typeof window === "undefined") return undefined;
  const data = window.__ROUTE_DATA__ as T | undefined;
  if (data === undefined) return undefined;
  delete window.__ROUTE_DATA__;
  return data;
}
