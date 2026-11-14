/**
 * The native router: navigation stacks the host shows with the platform's own
 * navigation (bars, back gestures, push/pop transitions, tab bars).
 *
 * JS owns the state; the host owns the UI. outlet() renders host kinds:
 *   tabs   one per app, its children are stacks (one per tab)
 *   stack  a navigation stack, its children are screens, bottom to top
 *   screen one scrollable screen, with the title its bar shows
 * The host animates whatever changed in a batch (new top = push, removed top =
 * pop) and reports what the user did natively: "pop" on a stack (value = depth
 * left) and "select" on the tabs (value = index).
 *
 * The web build uses router-web.ts instead (package.json `web` condition).
 */
import { type Entry, type Route, type RouterOptions, matcher, tabOf } from "./routes";

export type { Route, RouterOptions, Tab } from "./routes";

export function createRouter(routes: Record<string, Route>, { initial = "/", tabs = [] }: RouterOptions = {}) {
  const resolve = matcher(routes);
  let active = Math.max(0, tabOf(tabs, initial));

  const start = (root: string) => (root === initial ? [resolve(root)] : [resolve(root), resolve(initial)]);
  const stacks: Entry[][] = tabs.length
    ? tabs.map((tab, i) => (i === active ? start(tab.path) : [resolve(tab.path)]))
    : [[resolve(initial)]];
  const top = () => stacks[active][stacks[active].length - 1];

  const screen = (entry: Entry) =>
    div(
      { "data-native": "screen", title: entry.title },
      // dom.ts sends "end" when the screen's end scrolls near (from the host's "scroll").
      entry.onEndReached ? on("end", entry.onEndReached) : null,
      entry.view(entry.params),
    );

  const stack = (i: number) =>
    div(
      { "data-native": "stack", title: tabs[i]?.title ?? "", icon: tabs[i]?.icon ?? "" },
      // The user went back natively: the host already shows `depth` screens.
      on("pop", (event) => {
        stacks[i].length = Math.max(1, Number((event.target as HTMLInputElement).value));
        update();
      }),
      list(() => stacks[i], screen),
    );

  return {
    get path() {
      return top().path;
    },
    get canGoBack() {
      return stacks[active].length > 1;
    },
    /** Pushes a screen onto the current stack. */
    go(path: string) {
      stacks[active].push(resolve(path));
      update();
    },
    /** Selects the tab that owns `path` and makes `path` its only screen. */
    reset(path: string) {
      const tab = tabOf(tabs, path);
      if (tab >= 0) active = tab;
      // Back at the tab's root screen: pop to it, keeping its state.
      const root = stacks[active][0];
      stacks[active] = [root.path === path ? root : resolve(path)];
      update();
    },
    back() {
      if (stacks[active].length < 2) return;
      stacks[active].pop();
      update();
    },
    /** The app's navigation. Render it as the root: render(router.outlet, document.body). */
    outlet: () =>
      tabs.length
        ? div(
            { "data-native": "tabs", selected: () => String(active) },
            on("select", (event) => {
              active = Number((event.target as HTMLInputElement).value);
              update();
            }),
            ...tabs.map((_, i) => stack(i)),
          )
        : stack(0),
  };
}
