// expect: option() belongs inside a select()
// code: NUCLO5001
import { div, option } from "../../../src/index.ts";

export const App = () => div(option({ value: "a" }, "A"));
