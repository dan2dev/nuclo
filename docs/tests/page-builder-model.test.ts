import { expect, test } from "bun:test";
import { duplicate, exportHtml, flatten, imageUrl, makeBlock, moveTo, parentOf, starter } from "../src/demos/apps/page-builder/model.ts";

test("nested layouts move blocks without cycles or losing their identity", () => {
  const root = starter();
  const welcome = root.children[0];
  const heading = welcome.children[0];
  const highlights = root.children[1];
  const count = flatten(root).length;
  expect(moveTo(root, welcome, heading)).toBe(false);
  expect(moveTo(root, highlights, highlights.children[0])).toBe(false);
  expect(moveTo(root, root, welcome)).toBe(false);
  expect(moveTo(root, heading, highlights)).toBe(true);
  expect(parentOf(root, heading.id)).toBe(highlights);
  expect(flatten(root).length).toBe(count);
  expect(highlights.children.at(-1)).toBe(heading);
});

test("duplicating a layout gives every child a new id and independent styling", () => {
  const original = starter().children[0];
  const copy = duplicate(original);
  const ids = new Set(flatten(original).map((block) => block.id));
  expect(flatten(copy).some((block) => ids.has(block.id))).toBe(false);
  copy.children[0].styles.color = "#ffffff";
  expect(original.children[0].styles.color).toBe("#253c32");
});

test("HTML export keeps nested layout CSS and escapes text and attribute content", () => {
  const root = starter();
  root.children[0].children[0].content = '<script>alert("oops")</script>';
  const image = makeBlock("image");
  image.content = "javascript:alert(1)";
  image.name = '\" onerror=\"alert(1)';
  root.children.push(image);
  const html = exportHtml(root);
  expect(html).toContain("grid-template-columns:repeat(2, minmax(0, 1fr))");
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).not.toContain("javascript:");
  expect(html).toContain('alt="&quot; onerror=&quot;alert(1)"');
  expect(imageUrl("https://example.com/photo.png")).toBe("https://example.com/photo.png");
  expect(imageUrl("data:text/html,test")).toBe("");
});


test("indexed moves reorder forward and backward without replacing block objects", () => {
  const root = starter();
  const layout = root.children[0];
  const [heading, text, button] = layout.children;
  expect(moveTo(root, heading, layout, 3)).toBe(true);
  expect(layout.children).toEqual([text, button, heading]);
  expect(layout.children[2]).toBe(heading);
  expect(moveTo(root, heading, layout, 0)).toBe(true);
  expect(layout.children).toEqual([heading, text, button]);
  expect(moveTo(root, heading, layout, 1)).toBe(false);
  expect(layout.children).toEqual([heading, text, button]);
});

test("indexed moves insert across layouts and reject detached targets and descendants", () => {
  const root = starter();
  const welcome = root.children[0];
  const highlights = root.children[1];
  const heading = welcome.children[0];
  const original = [...highlights.children];
  expect(moveTo(root, heading, highlights, 1)).toBe(true);
  expect(highlights.children).toEqual([original[0], heading, original[1]]);
  expect(welcome.children).not.toContain(heading);
  const snapshot = JSON.stringify(root);
  expect(moveTo(root, highlights, original[0], 0)).toBe(false);
  expect(moveTo(root, heading, makeBlock("section"), 0)).toBe(false);
  expect(JSON.stringify(root)).toBe(snapshot);
});


test("a stale dragged object from before undo cannot mutate the restored tree", () => {
  const previousRoot = starter();
  const staleHeading = previousRoot.children[0].children[0];
  const restoredRoot = structuredClone(previousRoot);
  const snapshot = JSON.stringify(restoredRoot);
  expect(moveTo(restoredRoot, staleHeading, restoredRoot.children[1], 0)).toBe(false);
  expect(JSON.stringify(restoredRoot)).toBe(snapshot);
});
