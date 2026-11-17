// expect: same shape in TypeScript, but different native classes
interface Animal {
  sound(): string;
}
class Dog implements Animal {
  sound(): string {
    return "woof";
  }
}
// A Cat has an Animal's shape but doesn't declare `implements Animal`.
class Cat {
  sound(): string {
    return "meow";
  }
}
function speak(animal: Animal): string {
  return animal.sound();
}
export const both = `${speak(new Dog())} ${speak(new Cat())}`;
