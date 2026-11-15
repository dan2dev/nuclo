import { div, render, span } from "../../../src/index.ts";
const App = () =>
  div({ style: { row: true, items: "center", px: 12, py: 8, mt: 4, bg: "#fff", rounded: 6, size: 40, z: 2 } }, span("x", { style: { text: 14, weight: "bold", align: "center", truncate: true } }), div({ style: { center: true, col: true, m: 3, w: 10, h: 20, leading: 18, tracking: 1 } }));
render(App);
