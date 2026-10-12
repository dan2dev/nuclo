// A simulated disk shared by Files, Notes and Terminal. Only browser-local data.
export interface Entry { id: string; parent: string; name: string; kind: "folder" | "file"; content: string; modified: number; trashed: boolean }
const KEY = "nuclo-desktop-disk-v1";
const seed = (): Entry[] => [
  { id: "documents", parent: "root", name: "Documents", kind: "folder", content: "", modified: 0, trashed: false },
  { id: "projects", parent: "root", name: "Projects", kind: "folder", content: "", modified: 0, trashed: false },
  { id: "welcome", parent: "documents", name: "Welcome.txt", kind: "file", content: "Welcome to your workspace.\n\nMake yourself at home. Open Files to create folders and notes, or try the Terminal. Everything shares the same simulated disk.\n\nYour files stay in this browser between visits. Nothing is uploaded.\n\nA few things to try\n\n• Create a note in Documents, write something, and save.\n• Rename or move a file, then find it in Terminal.\n• Move a file to Trash and restore it.\n• Drag windows, double-click a title to maximize, or use the taskbar to switch apps.\n", modified: 0, trashed: false },
  { id: "ideas", parent: "documents", name: "Ideas.txt", kind: "file", content: "A little room for big ideas.\n\n- A reading list\n- A weekend project\n- Something worth remembering\n", modified: 0, trashed: false },
  { id: "readme", parent: "projects", name: "Readme.txt", kind: "file", content: "My projects\n\nStart with a folder. Make something good.\n", modified: 0, trashed: false },
];
export const entries = seed();
export let storageStatus = "Saved in this browser";
export const getEntry = (id: string) => entries.find((entry) => entry.id === id);
export function available(id: string): boolean {
  if (id === "root") return true;
  const entry = getEntry(id);
  return !!entry && !entry.trashed && available(entry.parent);
}
export const children = (parent: string) => entries.filter((entry) => entry.parent === parent && !entry.trashed).sort((a, b) => Number(b.kind === "folder") - Number(a.kind === "folder") || a.name.localeCompare(b.name));
export const pathOf = (id: string): string => id === "root" ? "/" : getEntry(id) ? `${pathOf(getEntry(id)!.parent).replace(/\/$/, "")}/${getEntry(id)!.name}` : "/";
export function resolvePath(path: string, cwd = "root") {
  let id = path.startsWith("/") ? "root" : cwd;
  for (const part of path.split("/").filter(Boolean)) {
    if (part === ".") continue;
    if (part === "..") { id = getEntry(id)?.parent ?? "root"; continue; }
    if (id !== "root" && getEntry(id)?.kind !== "folder") return undefined;
    const entry = children(id).find((entry) => entry.name === part);
    if (!entry || !available(entry.id)) return undefined;
    id = entry.id;
  }
  return available(id) ? id : undefined;
}
export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(entries)); storageStatus = "Saved in this browser"; }
  catch { storageStatus = "Browser storage unavailable · files stay for this session"; }
}
export function loadDisk() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const saved: unknown = JSON.parse(raw);
    if (!Array.isArray(saved) || !saved.every((e) => e && typeof e.id === "string" && e.id !== "root" && typeof e.parent === "string" && typeof e.name === "string" && e.name.trim() && !/[\/\\]/.test(e.name) && ["file", "folder"].includes(e.kind) && typeof e.content === "string" && typeof e.modified === "number" && typeof e.trashed === "boolean")) throw new Error("Invalid disk");
    const ids = new Set(saved.map((e) => e.id));
    if (ids.size !== saved.length) throw new Error("Duplicate IDs");
    for (const entry of saved) {
      const seen = new Set([entry.id]);
      let parent = entry.parent;
      while (parent !== "root") {
        const folder = saved.find((e) => e.id === parent);
        if (!folder || folder.kind !== "folder" || seen.has(parent)) throw new Error("Invalid folder tree");
        seen.add(parent); parent = folder.parent;
      }
      if (saved.some((e) => e !== entry && !e.trashed && !entry.trashed && e.parent === entry.parent && e.name === entry.name)) throw new Error("Duplicate names");
    }
    entries.splice(0, entries.length, ...saved);
  } catch { storageStatus = "Could not load saved disk · using starter files"; }
}
function validateName(parent: string, name: string, except?: string) {
  if (!name.trim() || name !== name.trim() || name === "." || name === ".." || /[\/\\\x00-\x1f]/.test(name) || name.length > 80) throw new Error("Use 1–80 characters without slashes or surrounding spaces.");
  if (!available(parent) || (parent !== "root" && getEntry(parent)?.kind !== "folder")) throw new Error("That folder is no longer available.");
  if (children(parent).some((entry) => entry.name === name && entry.id !== except)) throw new Error("An item with that name already exists.");
}
export function createEntry(parent: string, name: string, kind: Entry["kind"]) {
  validateName(parent, name);
  const entry: Entry = { id: crypto.randomUUID(), parent, name, kind, content: "", modified: Date.now(), trashed: false };
  entries.push(entry); persist(); return entry;
}
export function renameEntry(id: string, name: string) {
  const entry = getEntry(id);
  if (!entry || !available(id)) throw new Error("That item is no longer available.");
  validateName(entry.parent, name, id); entry.name = name; persist();
}
export function moveEntry(id: string, parent: string) {
  const entry = getEntry(id);
  if (!entry || !available(id)) throw new Error("That item is no longer available.");
  let ancestor = parent;
  while (ancestor !== "root") {
    if (ancestor === id) throw new Error("A folder cannot be moved inside itself.");
    ancestor = getEntry(ancestor)?.parent ?? "root";
  }
  validateName(parent, entry.name, id); entry.parent = parent; persist();
}
export function trashEntry(id: string) {
  const entry = getEntry(id);
  if (!entry || !available(id)) throw new Error("That item is no longer available.");
  entry.trashed = true; persist();
}
export function restoreEntry(id: string) {
  const entry = getEntry(id);
  if (!entry?.trashed) throw new Error("That item is not in Trash.");
  const parent = available(entry.parent) ? entry.parent : "root";
  validateName(parent, entry.name, id); entry.parent = parent; entry.trashed = false; persist();
}
export function writeEntry(id: string, content: string, expected?: string) {
  const entry = getEntry(id);
  if (!entry || entry.kind !== "file" || !available(id)) throw new Error("This file was moved to Trash. Restore it in Files before saving.");
  if (expected !== undefined && entry.content !== expected) throw new Error("This file changed in another window. Save a copy to keep your edits.");
  entry.content = content; entry.modified = Date.now(); persist();
}
