// expect: which the function reassigns
export function labeller(prefix: string): string {
  const Label = class {
    text(name: string): string {
      return `${prefix} ${name}`;
    }
  };
  prefix = prefix.toUpperCase();
  return new Label().text("x");
}
