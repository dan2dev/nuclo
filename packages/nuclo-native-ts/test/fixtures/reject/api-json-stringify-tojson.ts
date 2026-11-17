// expect: which has a toJSON method
// code: NUCLO6001
class Money {
  constructor(public cents: number) {}
  toJSON(): string {
    return (this.cents / 100).toFixed(2);
  }
}
export const text = JSON.stringify(new Money(150));
