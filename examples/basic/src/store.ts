export let store = {
  counter: 0,
  increment: () => {
    store.counter++;
    update();
  },
  decrement: () => {
    store.counter--;
    update();
  },
  reset: () => {
    store.counter = 0;
    update();
  },
};
