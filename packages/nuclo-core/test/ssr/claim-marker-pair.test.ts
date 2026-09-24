/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { claimMarkerPair, peekChild, startHydration, endHydration } from "../../src/hydration";

/** Builds a host from a markup string (comments included) for claiming. */
function host(html: string): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el;
}

function texts(nodes: Array<Node | null>): Array<string | null> {
  return nodes.map((n) => n?.textContent ?? null);
}

describe("claimMarkerPair", () => {
  beforeEach(() => startHydration());
  afterEach(() => endHydration());

  it("claims the start marker and finds its end marker, leaving the cursor after the start", () => {
    const el = host("<!--list-start-0--><li>a</li><!--list-end--><p>after</p>");
    const pair = claimMarkerPair(el, "list")!;
    expect(texts([pair.start, pair.end])).toEqual(["list-start-0", "list-end"]);
    expect(pair.recreated).toBe(false);
    expect((peekChild(el) as Element).tagName).toBe("LI");
  });

  it("skips leading whitespace text before the start marker", () => {
    const el = host("\n  <!--when-start-0-b0-->x<!--when-end-->");
    const pair = claimMarkerPair(el, "when")!;
    expect(pair.start.textContent).toBe("when-start-0-b0");
    expect(pair.end.textContent).toBe("when-end");
  });

  it("depth-counts directly nested blocks of the same kind", () => {
    const el = host("<!--when-start-0-b0--><!--when-start-0-b0-->in<!--when-end-->out<!--when-end--><!--when-end-->");
    const pair = claimMarkerPair(el, "when")!;
    // [0] outer start, [1] inner start, [2] "in", [3] inner end, [4] "out",
    // [5] outer end, [6] a trailing end that belongs to an enclosing block.
    expect(pair.end).toBe(el.childNodes[5]);
  });

  it("ignores markers of the other kind while scanning", () => {
    const el = host("<!--list-start-0--><!--when-start-0-b0--><!--when-end--><!--list-end-->");
    const pair = claimMarkerPair(el, "list")!;
    expect(pair.end).toBe(el.lastChild);
    expect(pair.recreated).toBe(false);
  });

  it("recreates a missing end marker right after the start marker", () => {
    const el = host("<!--list-start-0--><li>truncated</li>");
    const pair = claimMarkerPair(el, "list")!;
    expect(pair.recreated).toBe(true);
    expect(pair.start.nextSibling).toBe(pair.end);
    expect(pair.end.textContent).toBe("list-end");
    expect(el.childNodes.length).toBe(3);
  });

  it("claims nothing when the next child is not a matching start marker", () => {
    for (const html of ["<li>a</li>", "<!--other-->", "<!--when-start-0-bn--><!--when-end-->", ""]) {
      const el = host(html);
      const before = peekChild(el);
      expect(claimMarkerPair(el, "list")).toBeNull();
      expect(peekChild(el)).toBe(before);
    }
  });
});
