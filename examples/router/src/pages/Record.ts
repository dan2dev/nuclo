/**
 * The parent record page — mounted twice, as /invoices/:id and
 * /customers/:id, so you can see the same relative fragment open under both.
 *
 * Type into the scratch field before opening the preview: the preview is a
 * layer, so this page is never rebuilt and the text is still there afterwards.
 */
import type { Layer, Outlet, RouteContext } from "nuclo-router";
import { css, cx } from "../theme.ts";
import { btn, card, code, feature, field, pill, s } from "../ui.ts";

export default function RecordPage(ctx: RouteContext, layer: Layer, _data: unknown, outlet: Outlet) {
  let scratch = "";
  const log: string[] = [];

  async function openPreview(): Promise<void> {
    // The whole point: this call is identical on both parents.
    const result = await layer.push<string>("./preview");
    log.unshift(result ? `closed with "${result}"` : "dismissed");
    update();
  }

  // Placed by the page itself: into the layout's region({ id: "main" }).
  return view("main", div(
    s.page,

    feature(
      "A record, with a relative fragment mounted under it",
      "this page is one module serving two patterns, and the preview under it is another " +
        "module serving two more. nothing here knows which parent it is — the id comes " +
        "from whichever :param matched.",

      div(
        s.row,
        pill("info", `pattern ${ctx.pattern}`),
        pill("neutral", `id ${ctx.params.id ?? "—"}`),
      ),

      code(
        `// routes.ts\n` +
          `"/invoices/:id":  () => import("./pages/Record.ts"),\n` +
          `...mount("/invoices/:id", previewRoutes),\n` +
          `"/customers/:id": () => import("./pages/Record.ts"),\n` +
          `...mount("/customers/:id", previewRoutes),`,
      ),
    ),

    feature(
      "Open it relatively",
      'router.href("./preview") and layer.push("./preview") resolve against the ACTIVE ' +
        "route, so the same string reaches a different URL under each parent. a browser " +
        "would have resolved \"./preview\" one segment higher.",

      div(
        cx(s.cardBox, css({ gap: 14 })),

        div(
          field.row,
          span(field.label, "Scratch (proof this page survives the layer)"),
          input(field.input, {
            id: "scratch",
            placeholder: "type anything…",
            onInput: (event) => {
              scratch = (event.target as HTMLInputElement).value;
            },
          }),
        ),

        div(
          s.row,
          button(btn.primary, { id: "open-preview", onClick: () => void openPreview() }, 'push("./preview")'),
          // A plain link to the same place, built from ctx.path rather than
          // router.href("./preview"): this page is also the preview's parent,
          // and a relative href resolves against the matched — deepest — route.
          a({ id: "preview-link", href: `${ctx.path}/preview` }, btn.base, "or navigate to it"),
        ),

        span(s.caption, () => `scratch is "${scratch}"`),

        // The child route renders here. Navigating between children swaps only
        // this subtree: everything above — including the scratch field and its
        // focus — is left exactly as it was.
        div(
          css({
            border: "1px dashed",
            borderColor: "accent",
            rounded: "md",
            p: 12,
            mt: 4,
            minH: 60,
          }),
          { id: "record-outlet" },
          span(s.caption, "outlet() — the child route goes here"),
          outlet(),
        ),
        div(
          css({ font: "mono", text: 11, color: "textDim", col: true, gap: 2, minH: 28 }),
          list(
            () => log,
            (line, i) => span(i === 0 ? css({ color: "accent" }) : css({}), line),
          ),
        ),
      ),

      div(
        s.cols2,
        card(
          "the other parent",
          div(
            s.row,
            a({ href: "/invoices/42" }, btn.base, "/invoices/42"),
            a({ href: "/customers/7" }, btn.base, "/customers/7"),
          ),
        ),
        card(
          "resolution, from here",
          span(
            css({ font: "mono", text: 11, color: "textDim" }),
            `"./preview"  →  ${ctx.path}/preview`,
          ),
        ),
      ),
    ),
  ));
}
