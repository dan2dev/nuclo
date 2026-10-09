// /slow — the pending window, from the inside.
//
// This route's loader sleeps 1.2s after its import() resolves, so the stretch
// where `router.pending` is true is long enough to actually watch. The point is
// not the delay: it is what the router does *not* do during it. The outgoing
// page is still mounted, the URL has already changed, and the spinner is an
// addition to the tree rather than a replacement of it.
//
// The second half of the demo is the cache: come back and the same navigation
// is synchronous, because the resolved page function is kept per loader.
import type { RouteContext } from "nuclo-router";
import { css } from "../theme.ts";
import { code, feature, pill, s } from "../ui.ts";

const st = {
  link: css({
    font: "mono",
    text: 13,
    color: "accent",
    textDecoration: "none",
    borderBottom: "1px solid",
    borderColor: "border",
    hover: { borderColor: "accent" },
  }),
  fact: css({ col: true, gap: 5, py: 11, borderTop: "1px solid", borderColor: "border" }),
  factText: css({ text: 13, color: "textDim" }),
};

/** One observation, labelled by the Route member it is about. */
function fact(tone: "good" | "info" | "neutral", label: string, text: string) {
  return div(st.fact, div(s.row, pill(tone, label)), span(st.factText, text));
}

export function SlowPage(_ctx: RouteContext) {
  // Placed by the page itself: into the layout's region({ id: "main" }).
  return into("main", div(
    s.page,

    h2(s.title, "Slow chunk"),
    p(
      s.lead,
      "the first time you opened this page you waited about 1.2 seconds for it. " +
        "the delay is artificial — it lives in the loader, not in the router — and " +
        "it is here so the pending state is something you can see rather than " +
        "something you take on trust.",
    ),

    feature(
      "what just happened",
      "a loading route adds a spinner; it does not remove a page. that is the whole reason this example needs no loading placeholder and no skeleton — the spinner takes up room above the page while it is there, but nothing is ever unmounted or left blank.",
      code(
        '"/slow": () => import("./pages/Slow.ts").then(async (m) => {\n' +
          "  await new Promise((resolve) => setTimeout(resolve, 1200));\n" +
          "  return m.SlowPage;\n" +
          "}),",
      ),
      div(
        css({ mt: 14 }),
        fact(
          "info",
          "router.pending === true",
          "the loader returned a promise, so the router set pending, cleared " +
            "router.error and called update() straight away. the shell's " +
            "when(() => router.pending, spinner()) turned on, inside the outlet and " +
            "right above the page row.",
        ),
        fact(
          "good",
          "the previous page stayed",
          "the outlet is a one-row list(), and that row is only swapped in commit() — " +
            "which runs when the module resolves. nothing unmounts while a route is in " +
            "flight, so the page you came from is what you were looking at the whole time.",
        ),
        fact(
          "neutral",
          "the URL led the page",
          "pushState happens before the module is requested, so the address bar said " +
            "/slow for the full 1.2s. reload mid-load and you land on this route, not " +
            "the one you left — the history entry is never a lie about where you are.",
        ),
      ),
      p(
        s.note,
        "the readout at the top of this app shows the seam: for those 1.2s router.url " +
          "reads the new href (it is read off window.location) while router.path, " +
          ".pattern and .params still describe the page on screen — they come from the " +
          "entry that is committed, and nothing is committed yet. router.pending is how " +
          "you tell that gap from a settled route.",
      ),
    ),

    feature(
      "now do it again",
      "navigate away and come back. there is no spinner the second time, and router.pending never becomes true — not briefly, not for one frame.",
      div(
        s.row,
        a({ href: "/patterns" }, st.link, "→ /patterns"),
        span(s.caption, "then click “Slow chunk” in the nav, or press Back"),
      ),
      p(
        css({ text: 14, color: "textDim", mt: 14, maxW: 820 }),
        "the router caches the resolved page function keyed by the loader itself. " +
          "on the second visit load() finds it and returns the function, not a promise, " +
          "so navigate() takes its synchronous branch and commits in the same task:",
      ),
      code(
        "const loaded = load(found.value, found.pattern);\n" +
          "if (!isPromise(loaded)) {\n" +
          "  commit(…);              // same task — no pending, no spinner frame\n" +
          "  return Promise.resolve();\n" +
          "}\n" +
          "pendingPath = ctx.path;   // only a real promise gets here\n" +
          "error = null;\n" +
          "update();",
      ),
      p(
        s.note,
        "the 1.2s sleep is inside the loader, so it is paid once: what the cache holds " +
          "is the component the promise resolved to, and the loader is never called " +
          "twice. (a rejected load is evicted instead — that is what makes the /broken " +
          "retry work.)",
      ),
      div(
        css({ mt: 14 }),
        fact(
          "info",
          "preload: false",
          "with the default preload:true the router walks the route table at idle — " +
            "one not-yet-cached chunk at a time, deferring while a navigation is in " +
            "flight — so given enough idle time this chunk is in the cache before you " +
            "click, and the first click is instant too. this example turns preloading " +
            "off in routes.ts precisely so the first click is slow — see router-ssr " +
            "for preloading with the network panel as evidence.",
        ),
      ),
    ),
  ));
}
