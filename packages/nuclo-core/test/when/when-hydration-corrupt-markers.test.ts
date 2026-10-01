/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered branches in src/when/builder.ts hydrateRender:
 *  - lines 92-94: SSR HTML without a when-start marker → fresh render fallback
 *  - lines 107-111: depth-counted scan over directly nested when marker pairs
 *  - lines 116-126: missing when-end marker → recreated + branch re-rendered
 */
import { describe, it, expect, beforeEach } from "vitest";
import { hydrate } from "../../src/render";
import { renderToString } from "../../src/ssr/render-to-string";
import { when } from "../../src/when";
import "../../src";

describe("when() hydration with corrupt or missing markers", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("falls back to a fresh render when the SSR HTML has no when markers", () => {
    container.innerHTML = "<div>plain</div>";

    const el = hydrate(div(when(() => true, span("branch"))), container);

    expect(el.querySelector("span")?.textContent).toBe("branch");
    const comments = Array.from(el.childNodes).filter((n) => n.nodeType === 8);
    expect(comments.length).toBeGreaterThanOrEqual(2);
    // The stale text child was removed as unclaimed content.
    expect(el.textContent).toBe("branch");
  });

  it("depth-counts directly nested when marker pairs", () => {
    const component = () =>
      div(when(() => true, when(() => true, span("inner"))));

    container.innerHTML = renderToString(component());
    const existingSpan = container.querySelector("span")!;

    const el = hydrate(component(), container);

    expect(el.querySelector("span")).toBe(existingSpan);
    expect(el.textContent).toBe("inner");
  });

  it("steps over empty and unrelated comments while scanning for the end marker", () => {
    container.innerHTML =
      "<div><!--when-start-0-b0--><!----><!--unrelated--><span>x</span><!--when-end--></div>";

    const el = hydrate(div(when(() => true, span("x"))), container);

    // The scan tolerated the junk comments and found the real end marker.
    expect(el.querySelector("span")?.textContent).toBe("x");
    const commentTexts = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 8)
      .map((n) => n.textContent);
    expect(commentTexts).toContain("when-end");
  });

  it("recreates a missing when-end marker and renders the branch fresh", () => {
    container.innerHTML = "<div><!--when-start-0-b0--><span>stale</span></div>";

    const el = hydrate(div(when(() => true, span("fresh"))), container);

    const spans = el.querySelectorAll("span");
    expect(spans.length).toBe(1);
    expect(spans[0].textContent).toBe("fresh");
    const commentTexts = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 8)
      .map((n) => n.textContent);
    expect(commentTexts).toContain("when-end");
  });

  it("inserts the branch content when the matching SSR block is empty", () => {
    container.innerHTML = "<div><!--when-start-0:0--><!--when-end--></div>";

    const el = hydrate(div(when(() => true, span("a"))), container);

    expect(el.innerHTML).toBe(
      "<!--when-start-0:0--><span><!-- text-0 -->a</span><!--when-end-->",
    );
  });

  it("replaces unclaimable SSR content inside a matching block", () => {
    container.innerHTML =
      "<div><!--when-start-0:0--><span>old</span><!--when-end--><footer></footer></div>";
    const existingFooter = container.querySelector("footer")!;

    const el = hydrate(div(when(() => true, p("new")), footer()), container);

    expect(el.querySelector("span")).toBeNull();
    const block = el.querySelector("p")!;
    expect(block.textContent).toBe("new");
    expect(block.previousSibling?.textContent).toBe("when-start-0:0");
    expect(block.nextSibling?.textContent).toBe("when-end");
    // Siblings after the block are still claimed, not rebuilt.
    expect(el.querySelector("footer")).toBe(existingFooter);
  });

  it("removes SSR nodes left over after the claimed branch content", () => {
    container.innerHTML =
      "<div><!--when-start-0-b0--><span>a</span><span>extra</span><!--when-end--></div>";
    const existingSpan = container.querySelector("span")!;

    const el = hydrate(div(when(() => true, span("a"))), container);

    const spans = el.querySelectorAll("span");
    expect(spans.length).toBe(1);
    expect(spans[0]).toBe(existingSpan);
  });

  it("keeps the repaired block toggling on update()", () => {
    container.innerHTML = "<div><!--when-start-0:0--><!--when-end--></div>";
    let flag = true;

    const el = hydrate(div(when(() => flag, span("a")).else(p("b"))), container);
    expect(el.textContent).toBe("a");

    flag = false;
    update();
    expect(el.querySelector("span")).toBeNull();
    expect(el.textContent).toBe("b");
  });
});
