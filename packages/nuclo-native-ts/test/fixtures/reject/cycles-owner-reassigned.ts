// expect: the variable holding the object is reassigned
// code: NUCLO2001
// The closure stored in `b.onTap` captures `b`, which is later reassigned: the closure can't simply be handed its
// owner, because it reads whatever object `b` holds by then.
class Button {
  onTap: (() => void) | null = null;
  taps = 0;
}
export function tapTwice(): number {
  let b = new Button();
  b.onTap = () => {
    b.taps++;
  };
  const first = b;
  b = new Button();
  first.onTap?.();
  return b.taps;
}
