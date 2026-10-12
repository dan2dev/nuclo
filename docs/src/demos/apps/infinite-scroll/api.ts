// api.ts: a fake backend. fetchPage() behaves like a real request: it takes a
// moment, it answers with one page and the cursor of the next, and now and
// then it fails. Nothing here knows about the UI.

export interface Post {
  id: number;
  author: string;
  text: string;
  likes: number;
  liked: boolean;
  minutesAgo: number;
}

export interface Page {
  items: Post[];
  next: number | null; // the cursor of the next page; null after the last one
}

export const TOTAL = 96;
const PAGE_SIZE = 12;

const AUTHORS = ["Ada", "Grace", "Linus", "Margaret", "Dennis", "Barbara", "Ken", "Radia"];
const TEXTS = [
  "Shipped the new list diff. Rows on screen are never rebuilt now.",
  "Reminder: mutate, then update(). One call per event is plenty.",
  "Replaced 400 lines of store boilerplate with an array and a function.",
  "The sentinel row loaded three pages while I was writing this.",
  "Hot take: most state managers exist because mutation was banned.",
  "Pairing on the kanban demo. Dragging across columns feels great.",
  "Breakpoint at update() and you see every change in the app. Try it.",
  "Profiling says the fake fetch is the slow part. As it should be.",
  "Added undo by cloning state. Twelve lines, including the slider.",
  "Today I learned IntersectionObserver takes a rootMargin.",
  "Our docs site renders on the server and hydrates the same tree.",
  "Closing the week with zero re-render bugs. There are no re-renders.",
];

const post = (id: number): Post => ({
  id,
  author: AUTHORS[id % AUTHORS.length],
  text: TEXTS[(id * 7) % TEXTS.length],
  likes: (id * 37) % 240,
  liked: false,
  minutesAgo: id * 9 + 3,
});

export function fetchPage(cursor: number): Promise<Page> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.15) return reject(new Error("The network dropped the request"));
      const end = Math.min(cursor + PAGE_SIZE, TOTAL);
      const items = Array.from({ length: end - cursor }, (_, i) => post(cursor + i));
      resolve({ items, next: end < TOTAL ? end : null });
    }, 500 + Math.random() * 700);
  });
}
