/**
 * `select`, `option` and `optgroup`: a control that shows the chosen option and opens the options below it.
 * The same boxes and text on every platform, so it looks and behaves the same everywhere (the `web` target,
 * which is the browser's, uses the browser's own select).
 */
import { type Style, div, h1, h2, list, optgroup, option, p, render, select, small, update } from "../../src/index.ts";

interface City {
  id: string;
  name: string;
}

let size = "m";
let fruit = "";
let city = "oslo";
let picked = 0;
const cities: City[] = [
  { id: "oslo", name: "Oslo" },
  { id: "lima", name: "Lima" },
  { id: "kyoto", name: "Kyoto" },
];

const card: Style = { padding: 16, gap: 10, borderRadius: 12, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0" };

const App = () =>
  div(
    { style: { padding: 24, gap: 16, backgroundColor: "#ffffff" } },
    h1("Select"),
    div(
      { style: card },
      h2("Controlled"),
      select(
        {
          value: () => size,
          onChange: (e) => {
            size = e.target.value;
            picked++;
            update();
          },
          ariaLabel: "Size",
        },
        option({ value: "s" }, "Small"),
        option({ value: "m" }, "Medium"),
        option({ value: "l" }, "Large"),
        option({ value: "xl", disabled: true }, "Extra large (sold out)"),
      ),
      p(() => `size = ${size}, ${picked} changes`),
    ),
    div(
      { style: card },
      h2("Groups, and no value of its own"),
      select(
        { onChange: (e) => { fruit = e.target.value; update(); } },
        optgroup({ label: "Citrus" }, option({ value: "orange" }, "Orange"), option({ value: "lemon" }, "Lemon")),
        optgroup({ label: "Berries" }, option({ value: "strawberry" }, "Strawberry"), option({ value: "blueberry" }, "Blueberry")),
      ),
      p(() => (fruit === "" ? "nothing picked yet" : `picked ${fruit}`)),
    ),
    div(
      { style: card },
      h2("Options from a list"),
      select(
        { value: () => city, onChange: (e) => { city = e.target.value; update(); } },
        list(() => cities, (c) => option({ value: c.id }, c.name)),
      ),
      small(() => `city = ${city}`),
    ),
    div(
      { style: card },
      h2("Disabled"),
      select({ disabled: true }, option({ value: "a" }, "Cannot be opened")),
    ),
  );

render(App);
