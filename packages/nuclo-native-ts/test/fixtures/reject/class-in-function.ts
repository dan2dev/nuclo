// expect: which the function reassigns
export function measure(values: number[]): string {
  let unit = "cm";
  class Measure {
    constructor(readonly value: number) {}
    text(): string {
      return `${this.value} ${unit}`;
    }
  }
  const first = new Measure(values[0] ?? 0).text();
  unit = "m";
  return first;
}
