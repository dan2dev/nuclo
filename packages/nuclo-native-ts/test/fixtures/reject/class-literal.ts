// expect: `this` is supported in classes only
interface Greeter {
  readonly name: string;
  greet(): string;
}
class Polite implements Greeter {
  readonly name = "polite";
  greet(): string {
    return `hello from ${this.name}`;
  }
}
export const polite: Greeter = new Polite();
export const loud: Greeter = {
  name: "loud",
  greet() {
    return `HEY from ${this.name}`;
  },
};
