// expect: natively they are different types
// code: NUCLO1005
interface Animal {
  sound(): string;
}
class Dog implements Animal {
  sound(): string {
    return "woof";
  }
}
function chorus(animals: Animal[]): string {
  return animals.map((a) => a.sound()).join(" ");
}
const dogs: Dog[] = [new Dog(), new Dog()];
export const song = chorus(dogs);
