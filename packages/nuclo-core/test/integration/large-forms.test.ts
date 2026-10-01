/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, hydrate, forceUpdate } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr/render-to-string";
import { mulberry32, withServerGlobals } from "./fuzz-harness";
import "../../src";

/**
 * A large editable grid: every row carries a text input, a checkbox, a
 * <select> whose options come from a shared list(), a range input and a radio
 * group. Form controls hold state in properties, not attributes, so the
 * assertions read the live properties of every control after each step —
 * server render, hydration, user edits written back through handlers,
 * sorting, filtering, refetched option lists and forceUpdate().
 */
describe("large editable grid — form controls at scale", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  interface Person {
    id: number;
    name: string;
    active: boolean;
    country: string;
    level: number;
    plan: "free" | "pro" | "team";
  }
  interface Country { code: string; name: string }

  const PLANS = ["free", "pro", "team"] as const;
  const fetchCountries = (): Country[] => [
    { code: "br", name: "Brazil" },
    { code: "pt", name: "Portugal" },
    { code: "jp", name: "Japan" },
    { code: "ca", name: "Canada" },
  ];

  function makeGrid(count: number) {
    const rng = mulberry32(count);
    const state = {
      people: Array.from({ length: count }, (_, id): Person => ({
        id,
        name: `person ${id}`,
        active: rng() < 0.5,
        country: fetchCountries()[Math.floor(rng() * 4)]!.code,
        level: 100 + Math.floor(rng() * 300),
        plan: PLANS[Math.floor(rng() * 3)]!,
      })),
      countries: fetchCountries(),
      heading: "People",
      visible: (_person: Person): boolean => true,
    };
    const App = () =>
      section(
        h2(state.heading),
        div(
          { className: "grid" },
          list(() => state.people.filter(state.visible), (person) =>
            form(
              { className: () => (person.active ? "row active" : "row"), "data-id": String(person.id) },
              input({
                type: "text",
                value: () => person.name,
                onInput: (e) => { person.name = e.currentTarget.value; update(); },
              }),
              input({
                type: "checkbox",
                checked: () => person.active,
                onChange: (e) => { person.active = e.currentTarget.checked; update(); },
              }),
              select(
                {
                  value: () => person.country,
                  onChange: (e) => { person.country = e.currentTarget.value; update(); },
                },
                list(() => state.countries, (country) => option({ value: country.code }, country.name)),
              ),
              input({ type: "range", value: () => String(person.level), min: "0", max: "400" }),
              list(() => PLANS, (plan) =>
                input({
                  type: "radio",
                  name: `plan-${person.id}`,
                  value: plan,
                  checked: () => person.plan === plan,
                  onChange: () => { person.plan = plan; update(); },
                })),
              when(() => person.active, output(() => `${person.name} @ ${person.country}`)),
            )),
        ),
      );
    return { state, App };
  }

  /** Reads every control of every row and compares it with the data. */
  function expectGrid(g: ReturnType<typeof makeGrid>): void {
    const expected = g.state.people.filter(g.state.visible);
    const rows = container.getElementsByTagName("form");
    if (rows.length !== expected.length) throw new Error(`expected ${expected.length} rows, got ${rows.length}`);
    for (let k = 0; k < expected.length; k++) {
      const person = expected[k]!;
      const row = rows[k]!;
      const controls = row.getElementsByTagName("input");
      const [text, box, range] = [controls[0]!, controls[1]!, controls[2]!];
      const dropdown = row.getElementsByTagName("select")[0]!;
      const radios = [controls[3]!, controls[4]!, controls[5]!];
      const summary = row.getElementsByTagName("output")[0];
      const problems: string[] = [];
      if (row.getAttribute("data-id") !== String(person.id)) problems.push(`row id ${row.getAttribute("data-id")}`);
      if (text.value !== person.name) problems.push(`name "${text.value}"`);
      if (box.checked !== person.active) problems.push(`active ${box.checked}`);
      if (dropdown.value !== person.country) problems.push(`country "${dropdown.value}"`);
      if (dropdown.options.length !== g.state.countries.length) problems.push(`${dropdown.options.length} options`);
      if (range.value !== String(person.level)) problems.push(`level ${range.value}`);
      const checkedPlan = radios.filter((r) => r.checked).map((r) => r.value).join(",");
      if (checkedPlan !== person.plan) problems.push(`plan "${checkedPlan}"`);
      if (row.className !== (person.active ? "row active" : "row")) problems.push(`class "${row.className}"`);
      if ((summary?.textContent ?? null) !== (person.active ? `${person.name} @ ${person.country}` : null)) problems.push(`summary "${summary?.textContent}"`);
      if (problems.length) throw new Error(`row ${k} (person ${person.id}): ${problems.join("; ")}`);
    }
  }

  function exercise(g: ReturnType<typeof makeGrid>): void {
    const { state } = g;
    const rng = mulberry32(42);
    const rows = container.getElementsByTagName("form");
    expectGrid(g);

    // User edits, written back by the row's own handlers (each calls update()).
    for (let k = 0; k < 40; k++) {
      const index = Math.floor(rng() * rows.length);
      const row = rows[index]!;
      const controls = row.getElementsByTagName("input");
      const kind = k % 4;
      if (kind === 0) {
        controls[0]!.value = `edited ${k}`;
        controls[0]!.dispatchEvent(new Event("input"));
      } else if (kind === 1) {
        controls[1]!.click();
      } else if (kind === 2) {
        const dropdown = row.getElementsByTagName("select")[0]!;
        dropdown.value = state.countries[Math.floor(rng() * state.countries.length)]!.code;
        dropdown.dispatchEvent(new Event("change"));
      } else {
        controls[3 + Math.floor(rng() * 3)]!.click();
      }
    }
    expectGrid(g);

    // State changes made by the app.
    for (const person of state.people) {
      if (person.id % 3 === 0) person.level = (person.level + 137) % 400;
      if (person.id % 5 === 0) person.plan = "team";
    }
    update();
    expectGrid(g);

    // Sort by name (rows move), then by level descending.
    state.people = state.people.slice().sort((x, y) => (x.name < y.name ? -1 : x.name > y.name ? 1 : x.id - y.id));
    update();
    expectGrid(g);
    state.people = state.people.slice().sort((x, y) => y.level - x.level || x.id - y.id);
    update();
    expectGrid(g);

    // Filter, then clear the filter (rows are rebuilt).
    state.visible = (person) => person.active;
    update();
    expectGrid(g);
    state.visible = () => true;
    update();
    expectGrid(g);

    // The option list is refetched (new objects), reordered and extended.
    state.countries = fetchCountries().reverse();
    update();
    expectGrid(g);
    state.countries = [...state.countries, { code: "mx", name: "Mexico" }];
    state.people[0]!.country = "mx";
    update();
    expectGrid(g);

    // A build-time value changes: forceUpdate() rebuilds in place.
    const firstRow = rows[0];
    state.heading = "Pessoas";
    forceUpdate();
    expect(container.getElementsByTagName("h2")[0]!.textContent).toBe("Pessoas");
    expect(rows[0]).toBe(firstRow);
    expectGrid(g);

    // Everything still reacts afterwards.
    for (const person of state.people) person.active = !person.active;
    state.people = state.people.slice().reverse();
    update();
    expectGrid(g);
  }

  it("600 rows — client render", () => {
    const g = makeGrid(600);
    render(g.App, container);
    exercise(g);
  }, 30_000);

  it("600 rows — server-rendered, hydrated in place", () => {
    const g = makeGrid(600);
    container.innerHTML = withServerGlobals(() => renderToString(g.App));
    const serverRows = Array.from(container.getElementsByTagName("form"));
    const serverControls = container.getElementsByTagName("input").length + container.getElementsByTagName("select").length;

    hydrate(g.App, container);

    const rows = container.getElementsByTagName("form");
    expect(rows.length).toBe(600);
    for (let k = 0; k < serverRows.length; k++) {
      if (rows[k] !== serverRows[k]) throw new Error(`row ${k} was rebuilt during hydration`);
    }
    expect(container.getElementsByTagName("input").length + container.getElementsByTagName("select").length).toBe(serverControls);
    exercise(g);
  }, 30_000);

  it("the server markup alone already shows the right state (before any script runs)", () => {
    const g = makeGrid(200);
    container.innerHTML = withServerGlobals(() => renderToString(g.App));
    const rows = container.getElementsByTagName("form");
    for (let k = 0; k < g.state.people.length; k++) {
      const person = g.state.people[k]!;
      const row = rows[k]!;
      const controls = row.getElementsByTagName("input");
      expect(controls[0]!.value).toBe(person.name);
      expect(controls[1]!.checked).toBe(person.active);
      expect(row.getElementsByTagName("select")[0]!.value).toBe(person.country);
      expect([controls[3]!, controls[4]!, controls[5]!].filter((r) => r.checked).map((r) => r.value)).toEqual([person.plan]);
      expect(row.className).toBe(person.active ? "row active" : "row");
    }
  });
});
