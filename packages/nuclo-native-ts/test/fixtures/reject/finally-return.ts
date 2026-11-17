// expect: leaving a try or catch block that has `finally` early
export function f(): number {
  try {
    return 1;
  } catch (e) {
    return 2;
  } finally {
    f();
  }
}
