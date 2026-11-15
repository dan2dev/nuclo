// expect: arrow function with an expression body
import { progress } from "../../../src/index.ts";

let done = 1;
export const App = () => progress({ value: () => { return done; } });
