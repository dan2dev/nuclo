import { afterAll, beforeEach, expect, test } from "bun:test";
import { available, children, createEntry, entries, getEntry, loadDisk, moveEntry, pathOf, renameEntry, resolvePath, restoreEntry, trashEntry, writeEntry } from "../src/demos/apps/desktop/filesystem.ts";

const initial = structuredClone(entries);
const saved = new Map<string, string>();
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value) } });
afterAll(() => { if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor); else Reflect.deleteProperty(globalThis, "localStorage"); });
beforeEach(() => { entries.splice(0, entries.length, ...structuredClone(initial)); saved.clear(); });

test("shared disk supports edits, moves, Trash, restore and persisted reload without losing IDs", () => {
  const folder = createEntry("documents", "My folder", "folder");
  const file = createEntry(folder.id, "Draft.txt", "file");
  writeEntry(file.id, "First draft");
  expect(resolvePath('My folder/Draft.txt', "documents")).toBe(file.id);
  expect(resolvePath("Draft.txt/anything", folder.id)).toBeUndefined();
  expect(() => createEntry(folder.id, "Draft.txt", "file")).toThrow("already exists");
  expect(() => renameEntry(file.id, "../oops")).toThrow("without slashes");
  expect(() => moveEntry(folder.id, folder.id)).toThrow("inside itself");
  expect(() => writeEntry(file.id, "Overwrite", "Old text")).toThrow("changed in another window");
  expect(getEntry(file.id)?.content).toBe("First draft");
  renameEntry(file.id, "Final.txt");
  moveEntry(folder.id, "projects");
  expect(pathOf(file.id)).toBe("/Projects/My folder/Final.txt");
  trashEntry(folder.id);
  expect(available(file.id)).toBe(false);
  expect(() => writeEntry(file.id, "Lost draft")).toThrow("Trash");
  restoreEntry(folder.id);
  expect(available(file.id)).toBe(true);
  entries.length = 0;
  loadDisk();
  expect(getEntry(file.id)?.content).toBe("First draft");
  expect(children(folder.id)[0].id).toBe(file.id);
});

test("restore rejects conflicting names and recovers children when their parent is in Trash", () => {
  const file = createEntry("documents", "Draft.txt", "file");
  trashEntry(file.id);
  const other = createEntry("documents", "Draft.txt", "file");
  expect(() => restoreEntry(file.id)).toThrow("already exists");
  trashEntry(other.id);
  trashEntry("documents");
  restoreEntry(file.id);
  expect(getEntry(file.id)?.parent).toBe("root");
  expect(available(file.id)).toBe(true);
});

test("invalid persisted trees cannot replace the working disk", () => {
  const cycle = structuredClone(initial);
  cycle[0].parent = cycle[0].id;
  saved.set("nuclo-desktop-disk-v1", JSON.stringify(cycle));
  loadDisk();
  expect(pathOf("welcome")).toBe("/Documents/Welcome.txt");
});
