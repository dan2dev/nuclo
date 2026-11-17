// expect: `#x in obj`
export class Token {
  #id = 1;
  static is(value: Token): boolean {
    return #id in value;
  }
}
