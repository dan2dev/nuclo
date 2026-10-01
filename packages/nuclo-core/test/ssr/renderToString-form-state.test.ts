/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderToString } from "../../src/ssr/render-to-string";
import { hydrate } from "../../src/render";
import { update } from "../../src/update/update";
import { withServerGlobals } from "../integration/fuzz-harness";
import "../../src";

/**
 * renderToString() can run on a real DOM (jsdom, happy-dom, a worker with a
 * DOM) as well as on nuclo's polyfill. On a real element, form state lives in
 * properties — setting `checked`, `value` or a select's value creates no
 * attribute — so the serializer has to write the attributes that make the
 * parsed page show that state. Both backends must produce markup that parses
 * to the same form state.
 */
describe("renderToString — form control state, real DOM and polyfill alike", () => {
  const parse = (html: string): HTMLDivElement => {
    const host = document.createElement("div");
    host.innerHTML = html;
    return host;
  };

  const BACKENDS: Array<[name: string, render: (app: () => unknown) => string]> = [
    ["real DOM", (app) => renderToString(app as never)],
    ["polyfill", (app) => withServerGlobals(() => renderToString(app as never))],
  ];

  for (const [name, ssr] of BACKENDS) {
    describe(name, () => {
      it("checkbox and radio: checked", () => {
        const host = parse(ssr(() =>
          div(
            input({ type: "checkbox", checked: true }),
            input({ type: "checkbox", checked: false }),
            input({ type: "checkbox", checked: () => true }),
            input({ type: "radio", name: "g", value: "a", checked: false }),
            input({ type: "radio", name: "g", value: "b", checked: true }),
          )));
        expect(Array.from(host.querySelectorAll("input")).map((el) => el.checked)).toEqual([true, false, true, false, true]);
      });

      it("text-like inputs: value", () => {
        const host = parse(ssr(() =>
          div(
            input({ value: "plain" }),
            input({ type: "text", value: () => 'quote " and <tag>' }),
            input({ type: "number", value: "42" }),
            input({ type: "email", value: "" }),
            input({ type: "hidden", value: "token" }),
          )));
        expect(Array.from(host.querySelectorAll("input")).map((el) => el.value)).toEqual(["plain", 'quote " and <tag>', "42", "", "token"]);
      });

      it("checkbox/radio values are kept, the implicit 'on' is not written", () => {
        const html = ssr(() => div(input({ type: "checkbox" }), input({ type: "checkbox", value: "yes", checked: true }), input({ type: "radio", value: "r" })));
        expect(html).not.toContain('value="on"');
        const boxes = Array.from(parse(html).querySelectorAll("input"));
        expect(boxes.map((el) => el.value)).toEqual(["on", "yes", "r"]);
        expect(boxes.map((el) => el.checked)).toEqual([false, true, false]);
      });

      it("select: the bound value is the selected option", () => {
        const letters = ["a", "b", "c"];
        const host = parse(ssr(() =>
          div(
            select({ value: "c" }, list(() => letters, (o) => option({ value: o }, o))),
            select({ value: () => "b" }, option({ value: "a" }, "A"), option({ value: "b" }, "B")),
            select(option({ value: "a" }, "A"), option({ value: "b" }, "B")),
            select({ value: "a" }, option({ value: "a" }, "A"), option({ value: "b" }, "B")),
          )));
        expect(Array.from(host.querySelectorAll("select")).map((el) => el.value)).toEqual(["c", "b", "a", "a"]);
      });

      it("select: options inside optgroups, including the very first one", () => {
        const host = parse(ssr(() =>
          div(
            select({ value: "z" }, optgroup({ label: "one" }, option({ value: "a" }, "A")), optgroup({ label: "two" }, option({ value: "y" }, "Y"), option({ value: "z" }, "Z"))),
            select({ value: "a" }, optgroup({ label: "one" }, option({ value: "a" }, "A"), option({ value: "b" }, "B"))),
          )));
        expect(Array.from(host.querySelectorAll("select")).map((el) => el.value)).toEqual(["z", "a"]);
      });

      it("multiple select: every selected option", () => {
        const chosen = new Set(["a", "c"]);
        const host = parse(ssr(() =>
          select({ multiple: true }, list(() => ["a", "b", "c"], (o) => option({ value: o, selected: () => chosen.has(o) }, o)))));
        expect(Array.from(host.querySelector("select")!.selectedOptions).map((o) => o.value)).toEqual(["a", "c"]);
      });

      it("textarea: value as content", () => {
        const host = parse(ssr(() => div(textarea({ value: "line 1\nline 2 </textarea>" }), textarea("child text"))));
        expect(Array.from(host.querySelectorAll("textarea")).map((el) => el.value)).toEqual(["line 1\nline 2 </textarea>", "child text"]);
      });

      it("a whole form hydrates in place and stays reactive", () => {
        const state = { name: "Ada", agree: true, plan: "pro", note: "hi" };
        const App = () =>
          form(
            input({ name: "name", value: () => state.name }),
            input({ type: "checkbox", name: "agree", checked: () => state.agree }),
            select({ name: "plan", value: () => state.plan }, option({ value: "free" }, "Free"), option({ value: "pro" }, "Pro")),
            textarea({ name: "note", value: () => state.note }),
          );
        const container = document.createElement("div");
        document.body.appendChild(container);
        container.innerHTML = ssr(App);

        const read = (): unknown[] => {
          const f = container.querySelector("form")!;
          return [
            (f.elements.namedItem("name") as HTMLInputElement).value,
            (f.elements.namedItem("agree") as HTMLInputElement).checked,
            (f.elements.namedItem("plan") as HTMLSelectElement).value,
            (f.elements.namedItem("note") as HTMLTextAreaElement).value,
          ];
        };
        expect(read()).toEqual(["Ada", true, "pro", "hi"]);

        const formEl = container.querySelector("form");
        hydrate(App, container);
        expect(container.querySelector("form")).toBe(formEl);
        expect(read()).toEqual(["Ada", true, "pro", "hi"]);

        Object.assign(state, { name: "Grace", agree: false, plan: "free", note: "bye" });
        update();
        expect(read()).toEqual(["Grace", false, "free", "bye"]);
        container.remove();
      });
    });
  }

  it("both backends parse to the same DOM for a mixed form", () => {
    const App = () =>
      div(
        input({ type: "checkbox", checked: true, id: "c" }),
        input({ value: "v", className: "field" }),
        select({ value: "b" }, option({ value: "a" }, "A"), option({ value: "b" }, "B")),
        textarea({ value: "t" }),
      );
    const describeForm = (host: HTMLDivElement): unknown[] => [
      host.querySelector<HTMLInputElement>("#c")!.checked,
      host.querySelector<HTMLInputElement>(".field")!.value,
      host.querySelector("select")!.value,
      host.querySelector("textarea")!.value,
    ];
    const onDom = describeForm(parse(renderToString(App)));
    const onPolyfill = describeForm(parse(withServerGlobals(() => renderToString(App))));
    expect(onDom).toEqual([true, "v", "b", "t"]);
    expect(onPolyfill).toEqual(onDom);
  });
});
