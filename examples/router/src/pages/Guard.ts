/**
 * /guard — leave guards.
 *
 * beforeLeave() registers a guard on this page. It is asked only when the page
 * is about to be discarded — a link, go(), Back or Forward — and returning
 * false keeps it. A query or hash change keeps the page, so it never asks.
 * The guard needs no cleanup: it lives and dies with the page.
 */
import type { PageProps, RouteContext } from "nuclo-router";
import { router } from "../routes.ts";
import { css, cx } from "../theme.ts";
import { btn, card, code, feature, field, pill, s } from "../ui.ts";

export default function GuardPage(_ctx: RouteContext, { layer, beforeLeave }: PageProps) {
  let draft = "";
  let saved = "";
  const dirty = (): boolean => draft !== saved;
  const log: string[] = [];

  beforeLeave((to) => {
    if (!dirty()) return true;
    const where = to ? to.url : "another site";
    const leave = window.confirm(`Discard your unsaved draft and go to ${where}?`);
    // Only "stayed" is ever seen: after "left" this page is gone.
    log.unshift(`asked about ${where} → ${leave ? "left" : "stayed"}`);
    update();
    return leave;
  });

  async function editInLayer(): Promise<void> {
    const edited = await layer.push<string>("/guard/edit");
    log.unshift(edited === undefined ? "the layer was dismissed" : `the layer closed with "${edited}"`);
    update();
  }

  return div(
    s.page,
    feature(
      "A guard on the page",
      "type something without saving, then try to leave: a nav link, a router.go() button, or " +
        "the browser's Back. you are asked first, and Cancel keeps you here with the draft intact.",
      div(
        s.row,
        when(dirty, pill("warn", "unsaved")).else(pill("good", "saved")),
        pill("info", "beforeLeave(guard)"),
      ),
      textarea(cx(field.input, css({ minH: 80 })), {
        placeholder: "a draft worth keeping…",
        onInput: (event) => {
          draft = (event.target as HTMLTextAreaElement).value;
          update();
        },
      }),
      div(
        s.row,
        button(btn.primary, {
          onClick: () => {
            saved = draft;
            update();
          },
        }, "save"),
        a({ href: "/patterns" }, btn.base, "leave: /patterns"),
        button(btn.base, { onClick: () => void router.go("/guard?tab=2", { replace: true }) }, "query change — not asked"),
        a({ href: "#guard-how" }, btn.base, "hash — not asked"),
      ),
      div(
        css({ col: true, gap: 2, minH: 60 }),
        list(
          () => log.slice(0, 4),
          (entry) => span(css({ font: "mono", text: 12, color: "textDim" }), entry),
        ),
      ),
    ),

    feature(
      "A guard on a layer",
      "the layer's form registers its own guard. Cancel, the shade, ✕ or the browser's Back — " +
        "every way of closing it with unsaved text asks first, because close() walks history " +
        "back and shares Back's code path.",
      div(s.row, button(btn.primary, { onClick: () => void editInLayer() }, "edit in a layer")),
    ),

    div(
      { id: "guard-how" },
      feature(
        "How",
        "register from the page; return false (or a promise of it) to stay.",
        code(
          `export default function Edit(_ctx, { beforeLeave }: PageProps) {\n` +
            `  let dirty = false;\n` +
            `  beforeLeave((to) => !dirty || confirm(\`Discard and go to \${to?.url}?\`));\n` +
            `  return form(textarea({ onInput: () => (dirty = true) }), …);\n` +
            `}`,
        ),
        div(
          s.cols2,
          card(
            "only when the page goes",
            span(
              "a child under a layout, a query change or a hash change keeps the page, so the " +
                "guard is not asked. it is dropped with its page — nothing to unregister.",
            ),
          ),
          card(
            "Back and Forward too",
            span(
              "a refused Back is walked back, so the address bar stays on this page. the router " +
                "can only do that for history entries it wrote itself.",
            ),
          ),
          card(
            "async is fine",
            span(
              "return a promise — your own dialog instead of confirm(). guards run innermost " +
                "first and stop at the first refusal; one that throws keeps the page.",
            ),
          ),
          card(
            "not the tab",
            span("closing the tab or reloading is beforeunload's job: it leaves the document, not the route."),
          ),
        ),
      ),
    ),
  );
}
