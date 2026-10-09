// /broken — a chunk that fails the first time it is loaded.
//
// The route's loader is `() => import("./pages/Broken.ts").then(m => m.load())`
// and `load()` throws on its first call. A throw inside a `.then()` comes back
// as a rejected promise, which is exactly the shape a real failed chunk has —
// so this page reproduces a flaky network without needing one.
//
// You are reading this on attempt 2, having clicked through from another page.
// What the page documents is what the router did with attempt 1: where the
// failure landed, what stayed on screen, and why retrying was possible at all.
//
// A cold load of /broken is a different story. start() awaits the loader with
// no catch of its own, so attempt 1 rejects straight out of
// `await router.start()` in main.ts and nothing renders at all. Only a
// client-side retry recovers — see the last card below.
import type { RouteContext } from "nuclo-router";
import { card, code, feature, pill, s } from "../ui.ts";

/**
 * How many times load() has run. A module-level counter, so it survives the
 * retry — see the second panel for why that is the interesting part.
 */
export let attempts = 0;

export function load() {
  attempts++;
  if (attempts === 1) throw new Error("simulated chunk failure (attempt 1)");
  return BrokenPage;
}

export function BrokenPage(_ctx: RouteContext) {
  // Placed by the page itself: into the layout's region({ id: "main" }).
  return view("main", div(
    s.page,

    feature(
      "attempt 1 failed, and nothing else did",
      "a rejected chunk is not a crash. the router records it on the route, logs it, " +
        "and leaves the page you were already on exactly where it was.",

      div(
        s.row,
        pill("bad", "attempt 1 — threw"),
        pill("good", "attempt 2 — this page"),
        span(s.caption, () => `attempts = ${attempts}`),
      ),

      div(
        s.grid,
        card(
          "router.error",
          span(
            "set to the Error the loader rejected with. the shell above reads it straight " +
              "off the route and renders the red panel — message and all.",
          ),
        ),
        card(
          "go() resolved",
          span(
            "the promise router.go() returned fulfilled; it did not reject. a stray link " +
              "click can never produce an unhandled rejection, which is why the failure " +
              "has to be surfaced on the route instead.",
          ),
        ),
        card(
          "console.error",
          span(
            'the router logged `nuclo-router: failed to load "/broken"` with the cause ' +
              "as a second argument, so the failure is never silent even if the app " +
              "ignores router.error.",
          ),
        ),
        card(
          "router.pending",
          span(
            "went true while the chunk was in flight and back to false when it rejected. " +
              "the shell's spinner is tied to it, so nothing was left spinning.",
          ),
        ),
        card(
          "the old page stayed up",
          span(
            "a failure never commits, so list()'s single row still held the previous " +
              "page. no blank frame, no layout shift — the error panel simply appeared " +
              "above it.",
          ),
        ),
        card(
          "the url had already changed",
          span(
            "pushState runs before the loader is called, so the address bar said /broken " +
              'while the error showed. the panel\'s button calls router.go("/broken") ' +
              "again, which is all a retry takes. a reload is not a retry, though: a cold " +
              "start() at this URL replays attempt 1 and rejects before the app renders.",
          ),
        ),
      ),

      p(
        s.note,
        "a failure that arrives after you have navigated somewhere else is dropped at the " +
          "router's generation check: no router.error, not even the console line. a stale " +
          "load cannot show you a stale error any more than it can show you a stale page.",
      ),
    ),

    feature(
      "why attempt 2 could succeed",
      "because a failed load is evicted from the router's module cache. without that, one " +
        "bad response would poison this route for the lifetime of the page — every later " +
        "click would be handed the same rejected promise back out of the cache.",

      code(
        `// nuclo-router — load(), the only place a chunk is awaited\n` +
          `const promise = result.then(\n` +
          `  (mod) => {\n` +
          `    const component = pickComponent(mod, pattern);\n` +
          `    cache.set(loader, component);   // replace the in-flight promise\n` +
          `    return component;\n` +
          `  },\n` +
          `  (error: unknown) => {\n` +
          `    cache.delete(loader);           // a failed load is not kept\n` +
          `    throw error;\n` +
          `  },\n` +
          `);\n` +
          `cache.set(loader, promise);         // concurrent navigations share it`,
      ),

      div(
        s.cols2,
        card(
          "what was evicted",
          span(
            () =>
              `the router's own map, keyed by the loader function — not the browser's ` +
              `module registry. Broken.ts itself stayed loaded, which is why the counter ` +
              `resumed at ${attempts} instead of starting over at 0.`,
          ),
        ),
        card(
          "when the error clears",
          span(
            "committing this navigation set router.error back to null. a route that has to " +
              "wait for its chunk clears it the moment the load starts, too — so the red " +
              "panel never outlives the attempt that caused it.",
          ),
        ),
      ),

      p(
        s.note,
        "this example sets preload: false. with idle preloading on (the default), the " +
          "preloader walks the table in declaration order one route per idle callback, so " +
          "given a few idle moments it would have reached this loader before you clicked, " +
          "absorbed the failure silently — a preload failure is not the user's problem, it " +
          "just moves to the next route — and evicted it. your click would then have landed " +
          "on attempt 2 and you would never have seen an error at all.",
      ),
    ),
  ));
}
