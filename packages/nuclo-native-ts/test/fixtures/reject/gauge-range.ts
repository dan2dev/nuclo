// expect: max must be a number literal
import { meter } from "../../../src/index.ts";

let top = 10;
export const App = () => meter({ value: 3, max: top });
