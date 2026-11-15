import { meter, progress } from "../../../src/index.ts";

let value = 10;

export const App = () => [
  progress({ value: () => value, max: 100 }),
  meter({ value: () => value, max: 100, low: 33, high: 66, optimum: 0 }),
  meter({ value: () => value, max: 100, low: 33, high: 66, optimum: 100 }),
  meter({ value: () => value, max: 100, low: 33, high: 66, optimum: 50 }),
];
