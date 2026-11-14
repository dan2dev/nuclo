/**
 * Layout check, web: does the layout engine the native hosts use (layout.ts)
 * agree with the browser's CSS? Lays the current screen out with the engine,
 * measuring leaves the browser's way, and compares every box with
 * getBoundingClientRect.
 */
import { type LayoutNode, layout } from "./layout";

export type { CheckResult, Mismatch } from "./check";
import type { CheckResult, Mismatch } from "./check";

const TEXT = new Set("SPAN P H1 H2 H3 H4 H5 H6 LABEL STRONG EM B I SMALL A".split(" "));

function kindOf(el: Element) {
  const tag = el.tagName;
  if (tag === "BUTTON") return "button";
  if (tag === "IMG") return "image";
  if (tag === "INPUT") return (el as HTMLInputElement).type === "checkbox" ? "checkbox" : "input";
  if (tag === "TEXTAREA") return "input";
  return TEXT.has(tag) ? "text" : "view";
}

const box = (node: Node) => {
  if (node.nodeType === 1) return (node as Element).getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(node);
  return range.getBoundingClientRect();
};

export function check(tolerance = 0.5): CheckResult {
  const root = (document.querySelector(".nuclo-screen") ?? document.body) as HTMLElement;
  const nodes = new Map<number, Node>();
  const parents = new Map<number, Node>();
  let next = 1;

  const build = (node: Node, parent: Node | null): LayoutNode => {
    const id = next++;
    nodes.set(id, node);
    if (parent) parents.set(id, parent);
    if (node.nodeType === 3) {
      const font = getComputedStyle(parent as Element);
      return { id, kind: "text", style: { fontSize: font.fontSize }, children: [] };
    }
    const el = node as HTMLElement;
    const kind = kindOf(el);
    const css = getComputedStyle(el);
    const inline = el.style;
    const style: Record<string, string> = { fontSize: css.fontSize };
    if (kind === "view") {
      style.flexDirection = css.flexDirection;
      const gap = css.flexDirection === "row" ? css.columnGap : css.rowGap;
      style.gap = gap === "normal" ? "0" : gap;
      style.alignItems = css.alignItems === "normal" ? "stretch" : css.alignItems;
    }
    if (parseFloat(css.flexGrow) > 0) style.flex = css.flexGrow;
    if (inline.padding) style.padding = css.paddingTop;
    if (inline.width) style.width = inline.width;
    if (inline.height) style.height = inline.height;
    const children =
      kind === "view"
        ? [...el.childNodes]
            .filter((c) => c.nodeType === 1 || (c.nodeType === 3 && c.textContent!.trim()))
            .map((c) => build(c, el))
        : [];
    return { id, kind, style, children };
  };

  // Leaves measured as the browser sets them: same font, fit-content up to maxWidth.
  const measure = (leaf: LayoutNode, maxWidth: number) => {
    const node = nodes.get(leaf.id)!;
    if (node.nodeType === 1 && (node as Element).tagName === "IMG") {
      const img = node as HTMLImageElement;
      return { w: img.naturalWidth, h: img.naturalHeight };
    }
    const font = getComputedStyle((node.nodeType === 1 ? node : parents.get(leaf.id)) as Element);
    const probe = document.createElement("span");
    probe.style.cssText = `position:absolute;left:-10000px;top:0;visibility:hidden;white-space:normal;line-height:1.35;width:max-content;max-width:${Number.isFinite(maxWidth) ? `${maxWidth}px` : "none"}`;
    probe.style.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
    probe.style.lineHeight = "1.35";
    probe.textContent = node.textContent;
    document.body.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    probe.remove();
    return { w: rect.width, h: rect.height };
  };

  const tree = build(root, null);
  const rootBox = root.getBoundingClientRect();
  const { frames } = layout(tree, rootBox.width, root === document.body ? rootBox.height : undefined, measure, devicePixelRatio);
  const mismatches: Mismatch[] = [];
  for (const id of nodes.keys()) {
    if (id !== tree.id && !frames.has(id)) mismatches.push({ id, expected: [], actual: null });
  }
  for (const [id, frame] of frames) {
    const node = nodes.get(id)!;
    const own = box(node);
    const outer = box(parents.get(id)!);
    const actual = [own.left - outer.left, own.top - outer.top, own.width, own.height];
    if (actual.some((v, i) => Math.abs(v - frame[i]) > tolerance)) {
      mismatches.push({ id, expected: frame.map((v) => Math.round(v * 100) / 100), actual: actual.map((v) => Math.round(v * 100) / 100) });
    }
  }
  const total = nodes.size - 1;
  return { total, matched: total - mismatches.length, mismatches, against: "the browser's CSS", tolerance };
}
