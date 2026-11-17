// expect: bind(owner, (owner, arg) => …)
// code: NUCLO2001
// A listener closure capturing its view, kept by the view's own model: a cycle the collector can't see.
class Model {
  listeners: ((n: number) => void)[] = [];
}
class View {
  seen = 0;
  model = new Model();
  constructor() {
    this.model.listeners.push((n) => {
      this.seen += n;
    });
  }
}
export const v = new View();
