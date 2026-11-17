// expect: Fallthrough case in switch
// code: TS7029
export function name(n: number): string {
  let s = "";
  switch (n) {
    case 1:
      s = "one";
    case 2:
      s += "two";
      break;
  }
  return s;
}
