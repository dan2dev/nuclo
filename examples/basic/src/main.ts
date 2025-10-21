import "./style.css";
import "nuclo";
import { bg, cn } from "./styling-poc";
import { store } from "./store";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

const app = div(
  cn("app"),
  h1(
    // onPhone.flexBox(),
    // onTablet.flexBox(),
    // onDesktop.flexBox(),
    // bg("#FFFFFF33"),
    "counter: ",
    span(() => store.counter),
  ),
  button("+", cn("primary"), on("click", store.increment)),
  button("reset", on("click", store.reset)),
  button("-", on("click", store.decrement)),
);

render(app, appRoot);
