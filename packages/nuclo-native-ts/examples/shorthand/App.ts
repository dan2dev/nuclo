/** nuclo-core's short style keys: the same boxes as the long keys, side by side. */
import { div, p, render } from "../../src/index.ts";

const App = () =>
  div(
    { style: { p: 24, gap: 12, bg: "#f8fafc" } },
    p("short keys", { style: { weight: "bold", text: 18 } }),
    div({ style: { row: true, items: "center", px: 16, py: 8, bg: "#4f46e5", rounded: 12, h: 48 } }, p("px py bg rounded row items", { style: { text: 14 } })),
    p("long keys", { style: { fontWeight: "bold", fontSize: 18 } }),
    div({ style: { flexDirection: "row", alignItems: "center", paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: "#4f46e5", borderRadius: 12, height: 48 } }, p("paddingLeft … flexDirection", { style: { fontSize: 14 } })),
  );

render(App);
