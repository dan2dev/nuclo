// expect: keeps `this`: stored in the object, it would be a reference cycle
// code: NUCLO4004
export const ticker = {
  count: 0,
  onTick: (): void => {},
  start() {
    // JavaScript's GC collects the object and the function together; Swift and Rust would leak both.
    this.onTick = () => {
      this.count += 1;
    };
  },
};
