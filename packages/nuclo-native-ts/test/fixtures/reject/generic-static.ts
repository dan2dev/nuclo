// expect: Static members of a generic class are not supported natively
export class Registry<T> {
  static count = 0;
  items: T[] = [];
}
