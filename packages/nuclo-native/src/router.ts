/**
 * A stack router for native apps: go() pushes a screen, back() pops it.
 * nuclo-router needs URL, history and location, which bare JS engines lack.
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

  const stack = [resolve(initial)];
  const top = () => stack[stack.length - 1];

  return {
    get path() {
      return top().path;
    },
    get canGoBack() {
      return stack.length > 1;
    },
    /** Pushes a screen. */
    go(path: string) {
      stack.push(resolve(path));
      update();
    },
    /** Swaps the whole stack for one screen, e.g. when switching tabs. */
    reset(path: string) {
      stack.splice(0, stack.length, resolve(path));
      update();
    },
    back() {
      if (stack.length < 2) return;
      stack.pop();
      update();
    },
    /** Where the current screen renders. */
    outlet: () => list(() => [top()], (entry) => entry.view(entry.params) as never),
  };
}
