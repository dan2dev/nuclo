/** Route matching shared by the native and web routers. */
export type Params = Record<string, string>;
export type View = (params: Params) => unknown;
/** A screen, optionally with the title its navigation bar shows. */
export type Route = View | { view: View; title?: string | ((params: Params) => string) };
/** A tab: its root path, label and icon (`chart`, `photo`, `person`; each host maps the name). */
export interface Tab {
  path: string;
  title: string;
  icon?: string;
}
export interface RouterOptions {
  initial?: string;
  tabs?: Tab[];
}
export interface Entry {
  path: string;
  params: Params;
  view: View;
  title: string;
}

export function matcher(routes: Record<string, Route>) {
  const table = Object.entries(routes).map(([pattern, route]) => ({
    parts: pattern.split("/"),
    route: typeof route === "function" ? { view: route } : route,
  }));

  return function resolve(path: string): Entry {
    const parts = path.split("/");
    for (const { parts: pattern, route } of table) {
      if (pattern.length !== parts.length) continue;
      const params: Params = {};
      const matches = pattern.every((part, i) => {
        if (part[0] !== ":") return part === parts[i];
        params[part.slice(1)] = parts[i];
        return true;
      });
      if (!matches) continue;
      const title = typeof route.title === "function" ? route.title(params) : (route.title ?? "");
      return { path, params, view: route.view, title };
    }
    throw new Error(`No route matches ${path}`);
  };
}

/** The tab a path belongs to: the one with the longest matching root path. */
export function tabOf(tabs: Tab[], path: string) {
  let best = -1;
  tabs.forEach((tab, i) => {
    const owns = tab.path === "/" ? true : path === tab.path || path.startsWith(tab.path + "/");
    if (owns && (best < 0 || tab.path.length > tabs[best].path.length)) best = i;
  });
  return best;
}
