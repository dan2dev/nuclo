// expect: "brightness" is declared at the top level of another module too
// code: NUCLO4003
import { console } from "../../../src/index.ts";
import * as other from "../modules/other.ts";

declare function brightness(level: string): void;

brightness("high");
console.log(other.brightness());
