/**
 * Imported by checks-bugs.ts only for a type: JavaScript never evaluates this module (the import is elided), so its
 * top-level code and initializers must not run natively either.
 */
import { bgModuleLog } from "./checks-bugs.ts";

export interface BgShape {
  bgW: number;
}

bgModuleLog.push("types-only module evaluated");
export const bgSide = bgModuleLog.push("its global initialized");
