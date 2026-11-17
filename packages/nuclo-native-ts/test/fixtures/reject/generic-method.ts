// expect: Generic methods are not supported natively
export class Box {
  map<U>(f: (n: number) => U): U {
    return f(1);
  }
}
