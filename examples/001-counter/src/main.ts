import "./style.css";
import "nuclo";
import { bg } from "./styling-poc";
import { store } from "./store";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

const app = div(
  // { className: "app" },
  h1(
    // s.grid("flex", "center").text("center"),
    // bg("#FFFFFF33"),
    "counter: ",
    span(() => store.counter),
  ),
  button("+", on("click", store.increment)),
  button("reset", on("click", store.reset)),
  button("-", on("click", store.decrement)),
);

render(app, appRoot);
