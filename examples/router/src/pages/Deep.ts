/**
 * /patterns/nested/deep — a static route three segments deep.
 *
 * Demonstrates: depth costs no extra *pattern* work — every static pattern
 * lives in one Map keyed by its canonical path, so the lookup is a single
 * `Map.get` whatever the segment count (the path itself is still split and
 * rejoined once to build that key) — static patterns are consulted before any
 * dynamic or catch-all pattern, and a static match carries the one shared
 * frozen empty params object instead of allocating a new one.
 */
import type { RouteContext } from "nuclo-router";
import { css } from "../theme.ts";
import { card, code, feature, pill, s } from "../ui.ts";

const link = css({ textDecoration: "none" });

export default function DeepPage(ctx: RouteContext) {
  return div(
    s.page,
    feature(
      "/patterns/nested/deep",
      "a static pattern with three segments. no pattern here is tried against " +
        "the path — compile() puts every static pattern into a Map under its " +
        "canonical path, so this page is found by one lookup, three segments " +
        "or thirty.",

      div(
        s.row,
        pill("good", "static"),
        pill("neutral", "1 Map.get"),
        pill("neutral", "0 params allocated"),
      ),

      div(
        css({ mt: 14 }),
        s.cols2,
        card("ctx.pattern", span(ctx.pattern)),
        card("ctx.path", span(ctx.path)),
        card(
          "ctx.params",
          span(JSON.stringify(ctx.params)),
          span(s.caption, `${Object.keys(ctx.params).length} keys`),
        ),
        card(
          "the shared object",
          span(`Object.isFrozen(ctx.params) === ${Object.isFrozen(ctx.params)}`),
          span(`prototype === ${String(Object.getPrototypeOf(ctx.params))}`),
        ),
      ),

      p(
        s.panelDesc,
        css({ mt: 16, mb: 8 }),
        "the whole lookup, in the order it runs. the Map is consulted first, so " +
          "a static pattern always wins — a “/patterns/:a/:b” added to the table " +
          "could never steal this path, and the “*” fallback never sees it.",
      ),
      code(
        `// match.ts — createMatcher()'s returned closure, in the order it runs\n` +
          `const segs = splitPath(pathname, true);  // non-empty, decoded\n` +
          `const path = joinSegments(segs);         // the canonical key\n` +
          `\n` +
          `const exact = statics.get(path);         // ① one Map.get, any depth\n` +
          `if (exact) return { pattern: exact.pattern, value: exact.value,\n` +
          `                    params: NO_PARAMS, path };\n` +
          `\n` +
          `for (…dynamic…)  if (matchOne(…)) return …  // ② declaration order\n` +
          `for (…catchAll…) if (matchOne(…)) return …  // ③ longest prefix first`,
      ),

      p(
        s.note,
        "NO_PARAMS is one frozen, null-prototype object — Object.freeze(Object." +
          "create(null)) at module scope — reused by every static match, so no " +
          "params object is allocated to tell you there were no params. the " +
          "dynamic patterns next door build theirs with Object.create(null) too, " +
          "in matchOne(), so a URL segment called “__proto__” lands in params as " +
          "data and never reaches Object.prototype.",
      ),
      p(
        s.note,
        "ctx.path is canonical — decoded, base stripped, no trailing slash, no " +
          "empty segments. “/patterns//nested/deep/” normalizes to the same " +
          "string and so hits the same Map entry.",
      ),

      div(
        css({ mt: 16 }),
        s.row,
        a({ href: "/patterns" }, link, s.caption, "← back to /patterns"),
      ),
    ),
  );
}
