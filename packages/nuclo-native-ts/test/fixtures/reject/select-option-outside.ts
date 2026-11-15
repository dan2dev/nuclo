// expect: option() belongs inside a select()
import { div, option } from "../../../src/index.ts";

export const App = () => div(option({ value: "a" }, "A"));
