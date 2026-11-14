/**
 * Layout check, web: does the layout engine the native hosts use (layout.ts)
 * agree with the browser's CSS? Styles each element as the native runtime does
 * (style.ts: css() rules, @media, inline styles, inheritance), lays the current
 * screen out with the engine, measuring leaves the browser's way, and compares
 * every box with getBoundingClientRect.
 */
import { getCssText } from "nuclo";
import { type LayoutNode, layout } from "./layout";
import { Sheet, type Styles, compute, declarations, mediaMatches } from "./style";

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

  const sheet = new Sheet(getCssText());
  const active = (media: string) => mediaMatches(media, innerWidth, innerHeight);
  const build = (node: Node, parent: Node | null, inherited: Styles | undefined): LayoutNode => {
    const id = next++;
    if (node.nodeType === 3) {
      nodes.set(id, node);
      parents.set(id, parent!);
      return { id, kind: "text", style: compute(inherited, []), children: [] };
    }
    const el = node as HTMLElement;
    const kind = kindOf(el);
    const inline = declarations(el.getAttribute("style") ?? "");
    const style = compute(inherited, sheet.cascade(el.localName, el.getAttribute("class") ?? "", active, inline));
    // A box the browser does not show has none to compare.
    if (style.display !== "none") {
      nodes.set(id, node);
      if (parent) parents.set(id, parent);
    }
    const children =
      kind === "view" && style.display !== "none"
        ? [...el.childNodes]
            .filter((c) => c.nodeType === 1 || (c.nodeType === 3 && c.textContent!.trim()))
            .map((c) => build(c, el, style))
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

  const tree = build(root, null, undefined);
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
