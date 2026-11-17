// expect: which has no method greet
// code: NUCLO1005
interface Greeter {
  name: string;
  greet(): string;
}
// A function-valued field is not a method natively: the object can't be a Greeter.
const record = { name: "r", greet: () => "hi" };
export const greeter: Greeter = record;
