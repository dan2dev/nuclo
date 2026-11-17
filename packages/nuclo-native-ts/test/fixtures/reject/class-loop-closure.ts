// expect: a closure capturing the variable of this `for` loop
// code: NUCLO6002
export function makers(): (() => string)[] {
  const out: (() => string)[] = [];
  for (let i = 0; i < 6; i += 2) {
    class Label {
      text(): string {
        return `#${i}`;
      }
    }
    out.push(() => new Label().text());
  }
  return out;
}
