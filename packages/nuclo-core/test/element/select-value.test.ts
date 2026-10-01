/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, hydrate, forceUpdate } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr/render-to-string";
import { withServerGlobals } from "../integration/fuzz-harness";
import "../../src";

/**
 * A <select> only accepts a value one of its <option>s carries. Attributes are
 * applied before children, so `select({ value }, option(...), ...)` writes the
 * value into a select with no options yet — the browser drops it and shows the
 * first option. The value must be applied again once the options exist: right
 * after the select is built, and (for a reactive value) on update() for as
 * long as it has not taken.
 */
describe("<select> value", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  const selectEl = (): HTMLSelectElement => container.getElementsByTagName("select")[0]!;
  const letters = ["a", "b", "c"];

  describe("client render", () => {
    it("static value written before the options is applied", () => {
      render(select({ value: "b" }, option({ value: "a" }, "A"), option({ value: "b" }, "B"), option({ value: "c" }, "C")), container);
      expect(selectEl().value).toBe("b");
    });

    it("static value written after the options is applied", () => {
      render(select(option({ value: "a" }, "A"), option({ value: "b" }, "B"), { value: "b" }), container);
      expect(selectEl().value).toBe("b");
    });

    it("reactive value written before a list() of options is applied on first render", () => {
      const selected = "c";
      render(select({ value: () => selected }, list(() => letters, (o) => option({ value: o }, o))), container);
      expect(selectEl().value).toBe("c");
    });

    it("options without a value attribute match by their text", () => {
      render(select({ value: "Beta" }, option("Alpha"), option("Beta"), option("Gamma")), container);
      expect(selectEl().value).toBe("Beta");
      expect(selectEl().selectedIndex).toBe(1);
    });

    it("options inside optgroup() and when() are found", () => {
      const more = true;
      render(
        select(
          { value: "z" },
          optgroup({ label: "first" }, option({ value: "a" }, "A")),
          when(() => more, optgroup({ label: "more" }, option({ value: "z" }, "Z"))),
        ),
        container,
      );
      expect(selectEl().value).toBe("z");
    });

    it("a value no option carries keeps the browser's default selection", () => {
      let wanted = "missing";
      render(
        div(
          select({ value: "missing" }, option({ value: "a" }, "A"), option({ value: "b" }, "B")),
          select({ value: () => wanted }, option({ value: "a" }, "A"), option({ value: "b", selected: true }, "B")),
        ),
        container,
      );
      const [fixed, reactive] = Array.from(container.getElementsByTagName("select"));
      expect(fixed!.value).toBe("a");
      expect(reactive!.value).toBe("b");

      update();
      update();
      expect(fixed!.value).toBe("a");
      expect(reactive!.value).toBe("b");

      wanted = "a";
      update();
      expect(reactive!.value).toBe("a");
    });

    it("many selects in list rows each show their own value", () => {
      const rows = Array.from({ length: 60 }, (_, k) => ({ id: k, pick: letters[k % 3]! }));
      render(
        div(list(() => rows, (row) => label(String(row.id), select({ value: row.pick }, option({ value: "a" }, "A"), option({ value: "b" }, "B"), option({ value: "c" }, "C"))))),
        container,
      );
      const values = Array.from(container.getElementsByTagName("select")).map((el) => el.value);
      expect(values).toEqual(rows.map((row) => row.pick));
    });
  });

  describe("update()", () => {
    it("a reactive value follows the state", () => {
      let selected = "a";
      render(select({ value: () => selected }, list(() => letters, (o) => option({ value: o }, o))), container);
      expect(selectEl().value).toBe("a");
      selected = "c";
      update();
      expect(selectEl().value).toBe("c");
      selected = "b";
      update();
      expect(selectEl().value).toBe("b");
    });

    it("options that arrive later pick up the pending value", () => {
      let options: string[] = [];
      const selected = "b";
      render(select(list(() => options, (o) => option({ value: o }, o)), { value: () => selected }), container);
      expect(selectEl().options.length).toBe(0);

      options = ["a"];
      update();
      expect(selectEl().value).toBe("a"); // "b" is not there yet

      options = ["a", "b", "c"];
      update();
      expect(selectEl().value).toBe("b");
    });

    it("a selection made by the user survives updates that do not change the state", () => {
      const selected = "a";
      render(select({ value: () => selected }, list(() => letters, (o) => option({ value: o }, o))), container);
      update();
      selectEl().value = "c"; // user picks another option; state is untouched
      update();
      update();
      expect(selectEl().value).toBe("c");
    });

    it("works together with onChange writing the state back", () => {
      const state = { selected: "a" };
      render(
        select(
          { value: () => state.selected, onChange: (e) => { state.selected = e.currentTarget.value; update(); } },
          list(() => letters, (o) => option({ value: o }, o)),
        ),
        container,
      );
      selectEl().value = "b";
      selectEl().dispatchEvent(new Event("change"));
      expect(state.selected).toBe("b");
      expect(selectEl().value).toBe("b");
    });
  });

  describe("options rendered by list() change", () => {
    interface Country { code: string; name: string }
    const fetchCountries = (): Country[] => [
      { code: "br", name: "Brazil" },
      { code: "pt", name: "Portugal" },
      { code: "jp", name: "Japan" },
    ];

    it("refetched options (new objects, same values) keep a bound selection", () => {
      let countries = fetchCountries();
      const selected = "pt";
      render(select({ value: () => selected }, list(() => countries, (c) => option({ value: c.code }, c.name))), container);
      expect(selectEl().value).toBe("pt");

      countries = fetchCountries(); // every row is rebuilt
      update();
      expect(selectEl().value).toBe("pt");
      expect(selectEl().options.length).toBe(3);
    });

    it("refetched options keep a selection the user made on an unbound select", () => {
      let countries = fetchCountries();
      render(select(list(() => countries, (c) => option({ value: c.code }, c.name))), container);
      selectEl().value = "jp";

      countries = fetchCountries();
      update();
      expect(selectEl().value).toBe("jp");
    });

    it("reordering, prepending and appending options never moves the selection", () => {
      let countries = fetchCountries();
      render(select(list(() => countries, (c) => option({ value: c.code }, c.name))), container);
      selectEl().value = "pt";

      countries = countries.slice().reverse();
      update();
      expect(selectEl().value).toBe("pt");

      countries = [{ code: "us", name: "USA" }, ...countries, { code: "fr", name: "France" }];
      update();
      expect(selectEl().value).toBe("pt");

      countries = [countries[2]!, countries[0]!, countries[4]!, countries[1]!, countries[3]!];
      update();
      expect(selectEl().value).toBe("pt");
      expect(Array.from(selectEl().options).map((o) => o.value)).toEqual(["pt", "us", "fr", "jp", "br"]);
    });

    it("removing the selected option falls back to the browser's default", () => {
      let countries = fetchCountries();
      render(select(list(() => countries, (c) => option({ value: c.code }, c.name))), container);
      selectEl().value = "pt";

      countries = countries.filter((c) => c.code !== "pt");
      update();
      expect(selectEl().value).toBe("br");

      countries = [];
      update();
      expect(selectEl().value).toBe("");
    });

    it("a state change in the same update() wins over the kept selection", () => {
      let countries = fetchCountries();
      let selected = "pt";
      render(select({ value: () => selected }, list(() => countries, (c) => option({ value: c.code }, c.name))), container);

      countries = fetchCountries().reverse();
      selected = "jp";
      update();
      expect(selectEl().value).toBe("jp");
    });

    it("options grouped in optgroup() lists keep the selection too", () => {
      let groups = [
        { label: "South", items: ["br", "ar"] },
        { label: "North", items: ["ca", "us"] },
      ];
      render(
        select(list(() => groups, (g) => optgroup({ label: g.label }, list(() => g.items, (code) => option({ value: code }, code))))),
        container,
      );
      selectEl().value = "ca";

      groups[1]!.items = ["us", "mx", "ca"]; // inner list reorders
      update();
      expect(selectEl().value).toBe("ca");

      groups = groups.slice().reverse(); // outer list moves whole optgroups
      update();
      expect(selectEl().value).toBe("ca");
    });

    it("duplicate option values: the selection stays on that value", () => {
      let items = [1, 2, 3, 2, 1];
      const wanted = (): string => String(items[items.length - 1]);
      render(select({ value: wanted }, list(() => items, (n) => option({ value: String(n) }, String(n)))), container);
      expect(selectEl().value).toBe("1");

      items = [3, 3, 1]; // the selected "1" row is dropped, another "1" stays
      update();
      expect(selectEl().value).toBe("1");
    });

    it("a multiple select keeps every selected option through a reorder", () => {
      let items = ["a", "b", "c", "d"];
      render(select({ multiple: true }, list(() => items, (o) => option({ value: o }, o))), container);
      const el = selectEl();
      for (const o of Array.from(el.options)) o.selected = o.value === "b" || o.value === "d";

      items = ["d", "c", "e", "a", "b"];
      update();
      expect(Array.from(el.selectedOptions).map((o) => o.value).sort()).toEqual(["b", "d"]);
    });
  });

  describe("SSR + hydrate()", () => {
    const ssr = (app: () => unknown): string => withServerGlobals(() => renderToString(app as never));

    it("the server marks the matching option selected instead of emitting a value attribute", () => {
      const html = ssr(() => select({ value: "b", name: "letter" }, option({ value: "a" }, "A"), option({ value: "b" }, "B")));
      expect(html.startsWith('<select name="letter"><option value="a">')).toBe(true);
      expect(html).toContain('<option value="b" selected>');
      expect(html.match(/ selected/g)?.length).toBe(1);
      container.innerHTML = html;
      expect(selectEl().value).toBe("b");
    });

    it("works for reactive values, list() options, text-valued options and optgroups", () => {
      const App = () =>
        div(
          select({ value: () => "c" }, list(() => letters, (o) => option({ value: o }, o))),
          select({ value: "Beta" }, option("Alpha"), option("Beta")),
          select({ value: "z" }, optgroup({ label: "g" }, option({ value: "y" }, "Y"), option({ value: "z" }, "Z"))),
        );
      container.innerHTML = ssr(App);
      expect(Array.from(container.getElementsByTagName("select")).map((el) => el.value)).toEqual(["c", "Beta", "z"]);
    });

    it("an explicitly selected option is not marked twice, and other selects are unaffected", () => {
      const html = ssr(() =>
        div(
          select({ value: "b" }, option({ value: "b", selected: true }, "B")),
          select(option({ value: "b" }, "B")),
        ));
      expect(html.match(/ selected/g)?.length).toBe(1);
    });

    it("hydrate() keeps the server's selection and stays reactive", () => {
      let selected = "b";
      const App = () => div(select({ value: () => selected }, list(() => letters, (o) => option({ value: o }, o))));
      container.innerHTML = ssr(App);
      const el = selectEl();
      expect(el.value).toBe("b");

      hydrate(App, container);
      expect(selectEl()).toBe(el);
      expect(el.value).toBe("b");

      selected = "c";
      update();
      expect(el.value).toBe("c");
    });

    it("hydrate() corrects a server/client mismatch", () => {
      let selected = "a";
      const App = () => div(select({ value: selected }, option({ value: "a" }, "A"), option({ value: "b" }, "B")));
      container.innerHTML = ssr(App);
      selected = "b";
      hydrate(App, container);
      expect(selectEl().value).toBe("b");
    });

    it("forceUpdate() re-applies a changed static value", () => {
      let selected = "a";
      const App = () => div(select({ value: selected }, option({ value: "a" }, "A"), option({ value: "b" }, "B")));
      render(App, container);
      const el = selectEl();
      selected = "b";
      forceUpdate();
      expect(selectEl()).toBe(el);
      expect(el.value).toBe("b");
    });
  });
});
