// expect: would shadow a name the generated Swift/Kotlin uses
// code: NUCLO4003
// A local named like a generated-code name is renamed natively; a `declare function` (called by platform code by its
// name) can't be.
import { div } from "../../../src/index.ts";

declare function launch(): string;

export const Badge = () => div(launch());
