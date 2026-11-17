// expect: FinalizationRegistry is not supported natively
// code: NUCLO6002
export const cleaned: string[] = [];
export const registry = new FinalizationRegistry<string>((held) => {
  cleaned.push(held);
});
