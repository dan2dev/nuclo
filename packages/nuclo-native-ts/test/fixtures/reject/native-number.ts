// expect: Annotate numbers of a native function as Int or Double
// code: NUCLO6000
import { console } from "../../../src/index.ts";

declare function brightness(level: number): void;

brightness(1);
console.log("set");
