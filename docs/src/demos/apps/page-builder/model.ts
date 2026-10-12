// The page is a tree of plain objects. Layout and styling are browser CSS.
export type Kind = "section" | "heading" | "text" | "button" | "image" | "divider";
export interface Block {
  id: string;
  kind: Kind;
  name: string;
  content: string;
  styles: Record<string, string>;
  children: Block[];
}
let nextId = 0;
export const kinds: { kind: Kind; label: string; hint: string }[] = [
  { kind: "section", label: "Layout", hint: "Group blocks in a stack, row or grid" },
  { kind: "heading", label: "Heading", hint: "Give your page a clear title" },
  { kind: "text", label: "Text", hint: "A paragraph, note or description" },
  { kind: "button", label: "Button", hint: "Make an action stand out" },
  { kind: "image", label: "Image", hint: "Add a picture from a URL" },
  { kind: "divider", label: "Divider", hint: "Separate parts of your page" },
];
export function makeBlock(kind: Kind): Block {
  const name = kinds.find((entry) => entry.kind === kind)!.label;
  const base = { id: `block-${++nextId}`, kind, name, children: [] as Block[] };
  switch (kind) {
    case "section": return { ...base, content: "", styles: { display: "flex", flexDirection: "column", gap: "16px", padding: "24px", borderRadius: "12px", backgroundColor: "#f4f1eb" } };
    case "heading": return { ...base, content: "A fresh perspective.", styles: { fontSize: "40px", fontWeight: "700", lineHeight: "1.15", color: "#253c32" } };
    case "text": return { ...base, content: "Every great page starts with an idea. Make this one yours.", styles: { fontSize: "16px", lineHeight: "1.7", color: "#536159" } };
    case "button": return { ...base, content: "Explore the possibilities", styles: { padding: "12px 22px", backgroundColor: "#253c32", color: "#ffffff", borderRadius: "8px", fontSize: "14px", fontWeight: "600", alignSelf: "flex-start" } };
    case "image": return { ...base, content: "", styles: { width: "100%", height: "220px", objectFit: "cover", borderRadius: "12px" } };
    case "divider": return { ...base, content: "", styles: { height: "1px", backgroundColor: "#d9dfda", margin: "12px 0" } };
  }
}
export function starter(): Block {
  const root = makeBlock("section");
  root.name = "Your page";
  root.styles = { display: "flex", flexDirection: "column", gap: "28px", padding: "40px", backgroundColor: "#ffffff", color: "#253c32", minHeight: "640px" };
  const intro = makeBlock("section");
  intro.name = "Welcome";
  intro.styles = { display: "flex", flexDirection: "column", gap: "16px", padding: "32px", backgroundColor: "#edf2ec", borderRadius: "12px" };
  const title = makeBlock("heading");
  title.content = "Room for your next big idea.";
  const text = makeBlock("text");
  text.content = "A little space to share what you do, what you love, and what comes next. Built by you, one block at a time.";
  intro.children = [title, text, makeBlock("button")];
  const grid = makeBlock("section");
  grid.name = "Highlights";
  grid.styles = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "20px" };
  grid.children = ["Make it personal", "Keep it simple"].map((content, index) => {
    const card = makeBlock("section");
    card.name = content;
    card.styles.backgroundColor = index ? "#f0ede6" : "#f4f6f3";
    const heading = makeBlock("heading");
    heading.content = content;
    heading.styles.fontSize = "22px";
    const paragraph = makeBlock("text");
    paragraph.content = index ? "Pick a block. Change a detail. Watch your page come together." : "Your words, your colors, your way of putting things together.";
    card.children = [heading, paragraph];
    return card;
  });
  root.children = [intro, grid];
  return root;
}
export function flatten(root: Block): Block[] { return [root, ...root.children.flatMap(flatten)]; }
export function parentOf(root: Block, id: string): Block | undefined {
  return flatten(root).find((block) => block.children.some((child) => child.id === id));
}
export function duplicate(block: Block): Block {
  const copy = structuredClone(block);
  for (const item of flatten(copy)) item.id = `block-${++nextId}`;
  copy.name += " copy";
  return copy;
}
// Index is the insertion slot before removal, so forward moves in the same layout stay accurate.
export function moveTo(root: Block, block: Block, target: Block, index = target.children.length) {
  if (block === root || target.kind !== "section" || flatten(block).includes(target) || !flatten(root).includes(target)) return false;
  const parent = parentOf(root, block.id);
  if (!parent) return false;
  const previous = parent.children.indexOf(block);
  if (previous < 0) return false;
  index = Math.max(0, Math.min(index, target.children.length));
  if (parent === target && previous < index) index--;
  if (parent === target && previous === index) return false;
  parent.children.splice(previous, 1);
  target.children.splice(index, 0, block);
  return true;
}
export function imageUrl(value: string) {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; } catch { return ""; }
}
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
export function exportHtml(root: Block) {
  function render(block: Block): string {
    const tag = { section: "section", heading: "h2", text: "p", button: "button", image: "img", divider: "hr" }[block.kind];
    const css = Object.entries(block.styles).map(([key, value]) => `${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}:${value}`).join(";");
    const attrs = `style="${escape(css)}"`;
    if (tag === "img") return `<img ${attrs} src="${escape(imageUrl(block.content))}" alt="${escape(block.name)}">`;
    if (tag === "hr") return `<hr ${attrs}>`;
    return `<${tag} ${attrs}>${block.kind === "section" ? block.children.map(render).join("\n") : escape(block.content)}</${tag}>`;
  }
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your page</title><style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif}h2,p{margin:0}h2,p,button{white-space:pre-wrap}button,hr{border:0}img{max-width:100%}section{min-width:0}h2,p,button{overflow-wrap:anywhere}@media(max-width:600px){section[style*="display:grid"]{grid-template-columns:1fr!important}body>section,section[style*="padding"]{padding:20px!important}h2[style*="font-size:40px"]{font-size:30px!important}}</style></head><body>\n${render(root)}\n</body></html>`;
}
