// expect: `#x in obj`
// code: NUCLO4004
export class Token {
  #id = 1;
  static is(value: Token): boolean {
    return #id in value;
  }
}
