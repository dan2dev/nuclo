/**
 * /stack — the page at the bottom of the stack.
 *
 * The scenario: a form with a dropdown that is missing the option the user
 * wants. A button opens a layer that creates one, and the promise it resolves
 * with is folded straight into this page's state — while this page is never
 * closed, never re-rendered and never loses what was typed into it.
 */
import type { Layer, RouteContext } from "nuclo-router";
import { css, cx } from "../theme.ts";
import { btn, card, code, feature, field, pill, s } from "../ui.ts";
import { options, type Option } from "../stack/store.ts";

export default function StackPage(_ctx: RouteContext, layer: Layer) {
  // Ordinary closure state. Nothing here is special — that is the point.
  let notes = "";
  let selected = options[0].id;
  const log: string[] = [];

  async function addOption(): Promise<void> {
    // Opens the layer and waits for it. `undefined` means dismissed.
    const created = await layer.push<Option>("/stack/new-option");
    if (!created) {
      log.unshift("dismissed — nothing created, nothing changed");
      update();
      return;
    }
    // The whole payoff: fold the result in and select it, in place.
    selected = created.id;
    log.unshift(`created "${created.label}" (${created.id}) and selected it`);
    update();
  }

  // Placed by the page itself: into the layout's region({ id: "main" }).
  return view("main", div(
    s.page,

    feature(
      "A stack of layers, not a replaced page",
      "route.push() opens a route as a new layer on top of this one and resolves with " +
        "whatever that layer closes with. the stack is one list(), so opening a layer is " +
        "an append — this page is not rebuilt, and its DOM, focus and form state stay " +
        "exactly as they were.",

      div(
        s.row,
        pill("info", "route.push(href)"),
        pill("good", "layer.close(result)"),
        pill("neutral", `this page is layer ${layer.depth}`),
      ),

      code(
        `// here, at the bottom of the stack\n` +
          `const created = await layer.push<Option>("/stack/new-option");\n` +
          `if (created) { selected = created.id; update(); }\n\n` +
          `// in the pushed page — \`layer\` is its second argument\n` +
          `layer.close(created);   // resolves the push() above\n` +
          `layer.close();          // dismissed: resolves undefined`,
      ),
    ),

    feature(
      "Try it",
      "type something into Notes first, then add an option. the note survives, because " +
        "this page never went away. inside that layer you can open a second one to create " +
        "a category — three layers deep, each awaiting the one above it.",

      div(
        cx(s.cardBox, css({ gap: 14 })),

        div(
          field.row,
          span(field.label, "Notes (proof this page is never rebuilt)"),
          input(field.input, {
            id: "notes",
            placeholder: "type anything…",
            onInput: (event) => {
              notes = (event.target as HTMLInputElement).value;
            },
          }),
        ),

        div(
          field.row,
          span(field.label, "Option"),
          div(
            css({ row: true, gap: 8, items: "center" }),
            select(
              field.input,
              {
                id: "picker",
                value: () => selected,
                onChange: (event) => {
                  selected = (event.target as HTMLSelectElement).value;
                },
              },
              list(
                () => options,
                (item) => option({ value: item.id }, `${item.label}  ·  ${item.category}`),
              ),
            ),
            button(btn.primary, { id: "add-option", onClick: () => void addOption() }, "+ New option"),
          ),
        ),

        div(
          css({ col: true, gap: 4 }),
          span(s.caption, "what came back from the layer"),
          div(
            css({ font: "mono", text: 11, color: "textDim", col: true, gap: 3, minH: 40 }),
            list(
              () => log,
              (line, i) => span(i === 0 ? css({ color: "accent" }) : css({}), line),
            ),
          ),
        ),

        span(s.caption, () => `notes currently: "${notes}"`),
      ),
    ),

    feature(
      "How it behaves",
      "the parts worth knowing before you build on it.",

      div(
        s.cols2,
        card(
          "the URL is the top layer",
          span(
            "push() adds a history entry, so the layer is linkable and Back closes it — " +
              "resolving its push() as dismissed, exactly like Cancel.",
          ),
        ),
        card(
          "a cold load is a standalone page",
          span(
            "the URL names the top layer but not the stack beneath it, so reloading a " +
              "layer's URL opens it at depth 1 with nothing to resolve to. a pushed route " +
              "has to make sense on its own.",
          ),
        ),
        card(
          "an ordinary navigation clears the stack",
          span(
            "clicking a nav link is not a layer: it replaces the whole stack and dismisses " +
              "every open layer, so no caller is left awaiting.",
          ),
        ),
        card(
          "a layer can open a layer",
          span(
            "layer.push() is the same call from inside a page, so a dialog can open its " +
              "own dialog without ever touching the Route.",
          ),
        ),
      ),

      p(
        s.note,
        "because the promise lives in a closure, it cannot survive a reload — that is the " +
          "one thing the URL cannot carry. treat the result as an optimisation of a flow " +
          "that also works the long way round.",
      ),
    ),
  ));
}
