// expect: declare it with an initial value so it can be shared
// code: NUCLO4004
export function labeller(words: string[]): string {
  let prefix: string;
  prefix = words[0] ?? "-";
  const Label = class {
    text(name: string): string {
      return `${prefix} ${name}`;
    }
  };
  prefix = prefix.toUpperCase();
  return new Label().text("x");
}
