// api.ts: a fake backend with no end. fetchPage() behaves like a real request:
// it takes a moment and answers with one page and the cursor of the next.
// Rows are generated on the fly from their id, so
// the same cursor always returns the same page. Nothing here knows about the UI.

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
  next: number; // the cursor of the next page
}

const PAGE_SIZE = 20;

const AUTHORS = ["Ada", "Grace", "Linus", "Margaret", "Dennis", "Barbara", "Ken", "Radia", "Edsger", "Frances", "Tony", "Yukihiro"];
const OPENERS = ["Shipped", "Fixed", "Rewrote", "Profiled", "Deleted half of", "Paired on", "Reviewed", "Benchmarked", "Documented", "Simplified"];
const SUBJECTS = ["the list diff", "the kanban demo", "the router", "the fake fetch", "the docs build", "the three.js inspector", "the form validation", "the SSR hydration", "the style engine", "the undo stack"];
const OUTCOMES = ["and it is faster now.", "with half the code.", "before lunch.", "and nothing re-rendered.", "and found the slow part.", "in one update() call.", "without a store.", "by mutating the array in place.", "and the mount count stayed put.", "while this feed kept loading."];
const EXTRAS = ["Breakpoint at update() showed every change.", "Rows already on screen were never rebuilt.", "The sentinel loaded the next page early.", "Plain objects, plain arrays, one update()."];

// A small integer hash: every field of a post is a deterministic function of its id.
function hash(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}
const pick = <T,>(list: T[], id: number, salt: number) => list[hash(id * 31 + salt) % list.length];

function post(id: number): Post {
  let text = `${pick(OPENERS, id, 1)} ${pick(SUBJECTS, id, 2)} ${pick(OUTCOMES, id, 3)}`;
  if (hash(id) % 3 === 0) text += ` ${pick(EXTRAS, id, 4)}`;
  return { id, author: pick(AUTHORS, id, 5), text, likes: hash(id + 7) % 900, liked: false, minutesAgo: id * 3 + 1 };
}

export function fetchPage(cursor: number): Promise<Page> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const items = Array.from({ length: PAGE_SIZE }, (_, i) => post(cursor + i));
      resolve({ items, next: cursor + PAGE_SIZE });
    }, 60 + Math.random() * 140);
  });
}
