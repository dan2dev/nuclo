// expect: after narrowing the union
// code: NUCLO1003
class Cat {
  speak(): string {
    return "meow";
  }
}
class Cow {
  speak(): string {
    return "moo";
  }
}
export function speak(x: Cat | Cow): string {
  return x.speak();
}
