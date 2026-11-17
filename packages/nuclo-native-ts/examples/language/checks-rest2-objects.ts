// rest2: getters / setters in object literals, `this` in a function filling an interface's method.

interface R2Greeter {
  readonly name: string;
  greet(): string;
}

export function r2LiteralAccessors(): string[] {
  const out: string[] = [];
  const point = {
    x: 3,
    y: 4,
    get length() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    },
    get label(): string {
      return `(${this.x}, ${this.y})`;
    },
  };
  out.push(`${point.length} ${point.label}`);
  point.x = 6;
  point.y = 8;
  out.push(`${point.length} ${point.label}`);
  let log = "";
  const temp = {
    celsius: 20,
    get fahrenheit(): number {
      return (this.celsius * 9) / 5 + 32;
    },
    set fahrenheit(f: number) {
      log += `set ${f};`;
      this.celsius = ((f - 32) * 5) / 9;
    },
  };
  out.push(`${temp.fahrenheit}`);
  temp.fahrenheit = 212;
  out.push(`${temp.celsius} ${temp.fahrenheit} ${log}`);
  temp.fahrenheit = temp.fahrenheit - 180;
  out.push(`${temp.celsius} ${log}`);
  const counter = {
    n: 0,
    get next(): number {
      this.n += 1;
      return this.n;
    },
  };
  out.push(`${counter.next} ${counter.next} ${counter.n}`);
  return out;
}

export function r2LiteralThis(): string[] {
  const loud: R2Greeter = {
    name: "loud",
    greet: function () {
      return `HEY from ${this.name}`;
    },
  };
  const quiet: R2Greeter = {
    name: "quiet",
    greet() {
      return `hi from ${this.name}`;
    },
  };
  const all: R2Greeter[] = [loud, quiet];
  return all.map((g) => g.greet());
}

interface R2Animal {
  sound(): string;
}

interface R2Named {
  name: string;
}

// Neither class declares `implements`: they conform structurally.
class R2Cat {
  lives = 9;
  constructor(public name: string) {}
  sound(): string {
    return `meow from ${this.name}`;
  }
}

class R2Robot {
  constructor(readonly name: string) {}
  sound(): string {
    return "beep";
  }
}

function r2Speak(a: R2Animal): string {
  return a.sound();
}

function r2Rename(n: R2Named, to: string): R2Named {
  n.name = to;
  return n;
}

function r2Shout(n: { name: string }): string {
  return n.name.toUpperCase();
}

export function r2Conformance(): string[] {
  const cat = new R2Cat("tom");
  const robot = new R2Robot("r2");
  const out = [r2Speak(cat), r2Speak(robot), r2Shout(cat), r2Shout(robot)];
  const same = r2Rename(cat, "felix");
  out.push(`${same === cat} ${cat.name} ${cat.sound()} ${cat.lives}`);
  const named: R2Named = robot;
  out.push(`${named.name} ${named === robot}`);
  const animals: R2Animal[] = [cat, robot, { sound: () => "moo" }];
  out.push(animals.map((a) => a.sound()).join(", "));
  return out;
}

interface R2User {
  id: number;
  name: string;
  email: string;
}

interface R2Product {
  id: number;
  name: string;
  price: number;
}

// Pick / Omit over a type parameter: one shape per instantiation.
function r2WithoutId<T extends { id: number }>(x: T): Omit<T, "id"> {
  const { id, ...rest } = x;
  return rest;
}

function r2OnlyName<T extends { name: string }>(x: T): Pick<T, "name"> {
  return { name: x.name };
}

// A named object type that refers to itself.
type R2Chain = { v: number } & { next?: R2Chain };

export function r2GenericShapes(): string[] {
  const u: R2User = { id: 1, name: "ann", email: "a@x" };
  const p: R2Product = { id: 2, name: "pen", price: 1.5 };
  const a = r2WithoutId(u);
  const b = r2WithoutId(p);
  const out = [`${a.name} ${a.email}`, `${b.name} ${b.price}`, r2OnlyName(u).name + r2OnlyName(p).name];
  const chain: R2Chain = { v: 1, next: { v: 2, next: { v: 4 } } };
  let total = 0;
  for (let c: R2Chain | undefined = chain; c; c = c.next) total += c.v;
  out.push(`${total}`);
  return out;
}
