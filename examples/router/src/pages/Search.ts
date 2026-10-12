/**
 * /search — the query string as state.
 *
 * The filter lives in the URL as ?q=, written with go(…, { replace: true }) on
 * every keystroke. A navigation that changes only the query keeps the page —
 * same DOM, same focus, same caret — so this page function runs once while you
 * type, and everything that depends on the query reads router.search live.
 */
import type { RouteContext } from "nuclo-router";
import { router } from "../routes.ts";
import { css } from "../theme.ts";
import { card, code, feature, field, pill, s } from "../ui.ts";

const FRUITS = [
  "apple", "apricot", "banana", "blackberry", "blueberry", "cherry", "date", "fig",
  "grape", "kiwi", "lemon", "lime", "mango", "melon", "orange", "peach", "pear", "plum",
];

/** Once per build: module scope survives navigation because the module is cached. */
let builds = 0;

const st = {
  list: css({ row: true, flexWrap: "wrap", gap: 6, minH: 64, items: "flex-start" }),
  item: css({ font: "mono", text: 12, px: 9, py: 5, rounded: "md", bg: "surfaceMuted", color: "textDim" }),
  link: css({ font: "mono", text: 12, color: "accent" }),
};

/** ?q= without disturbing any other key; a replace, so typing does not fill the history. */
function setQuery(value: string): void {
  const params = new URLSearchParams(router.search);
  if (value) params.set("q", value);
  else params.delete("q");
  const query = params.toString();
  void router.go(router.href(router.path) + (query ? `?${query}` : ""), { replace: true });
}

export default function SearchPage(ctx: RouteContext) {
  const build = (builds += 1);
  const q = (): string => router.search.get("q") ?? "";

  return div(
    s.page,
    feature(
      "Query as state",
      "type below: each keystroke replaces ?q= in the address bar. the page is kept, so the " +
        "input never loses focus, and the counter — captured once, at build time — never moves.",
      div(
        s.row,
        pill("good", `page built ${build}×`),
        pill("info", "router.search is live"),
        pill("neutral", "ctx.search is the snapshot"),
      ),
      input(field.input, {
        placeholder: "filter fruit…",
        autofocus: true,
        // Reactive, so Back and the links below update it too.
        value: () => q(),
        onInput: (event) => setQuery((event.target as HTMLInputElement).value),
      }),
      div(
        st.list,
        list(
          () => FRUITS.filter((fruit) => fruit.includes(q().toLowerCase())),
          (fruit) => span(st.item, fruit),
        ),
      ),
      div(
        css({ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, items: "baseline" }),
        span(s.caption, "router.search"),
        span(st.link, () => router.search.toString() || "(empty)"),
        span(s.caption, "ctx.search"),
        span(st.link, ctx.search.toString() || "(empty)"),
      ),
    ),

    feature(
      "Pushed queries keep the page too",
      "these are ordinary links, so each one is a history entry — click a few, then press Back. " +
        "every step keeps the page; only the query changes.",
      div(
        s.row,
        a({ href: "/search?q=berry" }, st.link, "?q=berry"),
        a({ href: "/search?q=ap" }, st.link, "?q=ap"),
        a({ href: "/search?q=m&sort=desc" }, st.link, "?q=m&sort=desc"),
        a({ href: "/search" }, st.link, "(no query)"),
      ),
    ),

    feature(
      "How",
      "read the query inside a function, write it with go().",
      code(
        `// read — inside a function, so update() re-reads it\n` +
          `list(() => FRUITS.filter((f) => f.includes(router.search.get("q") ?? "")), …)\n\n` +
          `// write — replace, so typing does not fill the history\n` +
          `router.go(\`/search?q=\${encodeURIComponent(value)}\`, { replace: true });`,
      ),
      div(
        s.cols2,
        card(
          "kept: same pattern, same path, no load()",
          span(
            "a query or hash change keeps the page. a route with a load() still rebuilds on " +
              "every visit — its data may depend on the query — see /data?slow=1.",
          ),
        ),
        card(
          "ctx is the build's snapshot",
          span(
            "the page was called once, with the query it was first built for. router.search " +
              "is the live one, like router.hash and router.url.",
          ),
        ),
      ),
    ),
  );
}
