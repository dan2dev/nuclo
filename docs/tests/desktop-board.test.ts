import { afterAll, beforeEach, expect, test } from "bun:test";
import { addCard, columns, cyclePriority, moveCard, removeCard, resetBoard, sortByPriority } from "../src/demos/apps/desktop/board.ts";

const initial = structuredClone(columns);
const saved = new Map<string, string>();
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value) } });
afterAll(() => { if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor); else Reflect.deleteProperty(globalThis, "localStorage"); });
beforeEach(() => { columns.splice(0, columns.length, ...structuredClone(initial)); saved.clear(); });

test("cards move within and across columns and stay the same objects", () => {
  const [todo, doing] = columns;
  const card = todo.cards[0];
  moveCard(card, doing, 1);
  expect(todo.cards.includes(card)).toBe(false);
  expect(doing.cards[1]).toBe(card);
  moveCard(card, doing, 0);
  expect(doing.cards[0]).toBe(card);
  moveCard(card, doing, doing.cards.length); // moving inside the same column counts the removal
  expect(doing.cards.at(-1)).toBe(card);
});

test("add, remove, priority and sort are plain array operations", () => {
  const todo = columns[0];
  addCard(todo, "New task");
  const added = todo.cards[0];
  expect(added.title).toBe("New task");
  expect(added.priority).toBe(2);
  cyclePriority(added);
  expect(added.priority).toBe(3);
  cyclePriority(added);
  expect(added.priority).toBe(1); // wraps around
  sortByPriority(todo);
  expect(todo.cards).toEqual([...todo.cards].sort((a, b) => b.priority - a.priority));
  removeCard(added);
  expect(todo.cards.includes(added)).toBe(false);
});

test("every change saves the board, and Reset writes the seed back", () => {
  addCard(columns[0], "Saved task");
  expect(saved.has("nuclo-desktop-board-v1")).toBe(true);
  const restored = JSON.parse(saved.get("nuclo-desktop-board-v1")!) as typeof columns;
  expect(restored[0].cards[0].title).toBe("Saved task");
  resetBoard(); // fresh columns replace the old ones
  expect(columns[0].cards.some((c) => c.title === "Saved task")).toBe(false);
  expect(JSON.parse(saved.get("nuclo-desktop-board-v1")!)[0].cards[0].title).not.toBe("Saved task");
});
