// expect: is a parameter: Swift passes arrays by value
export function add(xs: number[], x: number) {
  xs.push(x);
}
