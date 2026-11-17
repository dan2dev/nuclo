// expect: create it with `new`, not an object literal
interface Greeter {
  greet(name: string): string;
}
class Polite implements Greeter {
  greet(name: string): string {
    return `hello ${name}`;
  }
}
export const loud: Greeter = { greet: (name: string) => `HEY ${name}` };
export const polite: Greeter = new Polite();
