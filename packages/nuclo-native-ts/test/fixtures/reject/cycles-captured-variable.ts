// expect: stores into the variable "me", which a closure captures
// code: NUCLO2001
// A closure of an object reads the object back through a variable it captures: closure → variable → object → closure.
interface Greeter {
  name: string;
  greet: () => string;
}
export function greeter(name: string): Greeter {
  let me: Greeter | null = null;
  const g: Greeter = { name: name, greet: () => `hi from ${me?.name ?? "?"}` };
  me = g;
  return g;
}
