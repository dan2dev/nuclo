// expect: a closure capturing the variable of this `for` loop
export const fns: (() => number)[] = [];
for (let i = 0; i < 10; i += 2) fns.push(() => i);
