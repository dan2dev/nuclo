/**
 * /data/serial and /data/early — one page, two ways to declare its loader.
 *
 * Both routes import this module through a chunk held for 600 ms, and both
 * load data that takes 600 ms. /data/serial uses the `load` exported below, so
 * the data cannot start until the chunk has arrived; /data/early declares the
 * same loader in the table with withLoad(), so both start together.
 */
import type { PageProps, RouteContext } from "nuclo-router";
import { router } from "../routes.ts";
import { css } from "../theme.ts";
import { btn, code, feature, pill, s } from "../ui.ts";
import { clock, elapsed, startClock, type Timing } from "../timing.ts";

// Exported from the module: /data/serial runs it once this chunk is here.
export { loadTimed as load } from "../timing.ts";

function measure(path: string): void {
  startClock();
  void router.go(path);
}

export default function EarlyPage(ctx: RouteContext, { data: timing }: PageProps<Timing>) {
  const early = ctx.pattern === "/data/early";
  const builtAt = elapsed();
  const fromClick = clock.startedAt > 0;

  return div(
    s.page,
    feature(
      early ? "withLoad(): the data started beside the chunk" : "load() exported by the module: chunk, then data",
      fromClick
        ? "measured from your click. the chunk and the data each take 600 ms."
        : "opened directly, so these times are since the page loaded — use the buttons to measure a click.",
      div(
        s.row,
        pill(early ? "good" : "warn", `data started at +${timing.dataStartedAt} ms`),
        pill("info", `data done at +${timing.dataEndedAt} ms`),
        pill(early ? "good" : "warn", `page built at +${builtAt} ms`),
      ),
      code(
        early
          ? `// routes.ts — the loader sits in the entry bundle\n"/data/early": withLoad(() => slowChunk(import("./pages/Early.ts")), loadTimed),`
          : `// routes.ts — the loader travels inside the chunk\n"/data/serial": () => slowChunk(import("./pages/Early.ts")),\n\n// pages/Early.ts\nexport { loadTimed as load } from "../timing.ts";`,
      ),
      div(
        s.row,
        button(btn.primary, { onClick: () => measure(early ? "/data/serial" : "/data/early") }, early ? "measure /data/serial" : "measure /data/early"),
        a({ href: "/data" }, btn.base, "back to /data"),
      ),
      p(
        s.note,
        "only the first visit is cold: each route caches its chunk, so a second visit pays for " +
          "the data alone and both read about 600 ms. reload the page to go cold again.",
      ),
      span(css({ text: 12, color: "textMuted" }), `ctx.pattern: ${ctx.pattern}`),
    ),
  );
}
