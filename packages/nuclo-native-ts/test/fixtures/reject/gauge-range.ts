// expect: max must be a number literal
// code: NUCLO6002
import { meter } from "../../../src/index.ts";

let top = 10;
export const App = () => meter({ value: 3, max: top });
