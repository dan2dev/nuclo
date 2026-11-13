/**
 * A stack router: go() pushes a screen, back() pops it.
 *
 * Native keeps its own stack. On the web the browser history is the stack and
 * the route lives in the URL hash (#/gallery/dunes), so links, reloads and the
 * browser's back button work, on any static host.
 */
type Params = Record<string, string>;
type View = (params: Params) => unknown;
interface Entry {
  path: string;
  params: Params;
  view: View;
}

export function createRouter(routes: Record<string, View>, initial = "/") {
  const table = Object.entries(routes).map(([pattern, view]) => ({ parts: pattern.split("/"), view }));

  function resolve(path: string): Entry {
    const parts = path.split("/");
    for (const route of table) {
      if (route.parts.length !== parts.length) continue;
      const params: Params = {};
      const matches = route.parts.every((part, i) => {
        if (part[0] !== ":") return part === parts[i];
        params[part.slice(1)] = parts[i];
        return true;
      });
      if (matches) return { path, params, view: route.view };
    }
    throw new Error(`No route matches ${path}`);
  }

  const web = typeof history !== "undefined" && typeof location !== "undefined";
  const fromUrl = () => {
    try {
      return resolve(location.hash.slice(1) || initial);
    } catch {
      return resolve(initial);
    }
  };

  const stack = [web ? fromUrl() : resolve(initial)];
  const top = () => stack[stack.length - 1];

  if (web) {
    addEventListener("hashchange", () => {
      stack[0] = fromUrl();
      update();
    });
  }

  return {
    get path() {
      return top().path;
    },
    get canGoBack() {
      return web ? history.length > 1 : stack.length > 1;
    },
    /** Pushes a screen. */
    go(path: string) {
      if (web) location.hash = path;
      else {
        stack.push(resolve(path));
        update();
      }
    },
    /** Swaps the whole stack for one screen, e.g. when switching tabs. On the web this is a normal navigation. */
    reset(path: string) {
      if (web) location.hash = path;
      else {
        stack.splice(0, stack.length, resolve(path));
        update();
      }
    },
    back() {
      if (web) history.back();
      else if (stack.length > 1) {
        stack.pop();
        update();
      }
    },
    /** Where the current screen renders. */
    outlet: () => list(() => [top()], (entry) => entry.view(entry.params) as never),
  };
}
