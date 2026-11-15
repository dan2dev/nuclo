import { div, render, span } from "../../../src/index.ts";
const App = () =>
  div({ style: { flexDirection: "row", alignItems: "center", paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, marginTop: 4, backgroundColor: "#fff", borderRadius: 6, width: 40, height: 40, zIndex: 2 } }, span("x", { style: { fontSize: 14, fontWeight: "bold", textAlign: "center", numberOfLines: 1 } }), div({ style: { alignItems: "center", justifyContent: "center", flexDirection: "column", margin: 3, width: 10, height: 20, lineHeight: 18, letterSpacing: 1 } }));
render(App);
