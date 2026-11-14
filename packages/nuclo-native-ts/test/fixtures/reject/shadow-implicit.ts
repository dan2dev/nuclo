// expect: would shadow a name the generated Swift/Kotlin uses
import { div } from "../../../src/index.ts";

export const Badge = () => {
  const A = "a";
  return div(A);
};
