/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered browser-path lines of src/polyfill/Element.ts:
 *  - lines 240-270: CSSStyleSheet mock on <style> elements, including nested
 *    @-rule insertRule/deleteRule (lines 247-261)
 *  - lines 288-289 / 337-341: _childNodes bookkeeping in appendChild/insertBefore
 *  - lines 461-465 / 480-484: querySelector descending into grandchildren
 *  - line 553: browser classList.remove() early return with no tokens
 *  - serialization branches for empty text/comment children (lines 167-204)
 */
import { describe, it, expect } from "vitest";
import { NucloElement } from "../../src/polyfill/Element";

describe("NucloElement browser sheet mock (<style>)", () => {
  it("insertRule handles plain rules and nested @-rules", () => {
    const el = new NucloElement("style");
    const sheet = el.sheet!;

    // Plain rule, explicit and implicit index.
    expect(sheet.insertRule(".a{color:red}", 0)).toBe(0);
    expect(sheet.insertRule(".b{color:blue}")).toBe(1);
    expect(sheet.cssRules.length).toBe(2);

    // @-rule: builds a grouping rule with its own insertRule/deleteRule.
    const idx = sheet.insertRule("@media (min-width: 600px) { }");
    const group = sheet.cssRules[idx] as CSSMediaRule;
    expect(group.conditionText).toContain("min-width: 600px");
    expect(group.media.mediaText).toContain("min-width: 600px");

    expect(group.insertRule(".c{color:green}")).toBe(0);
    expect(group.insertRule(".d{color:black}", 0)).toBe(0);
    expect(group.cssRules.length).toBe(2);
    expect((group.cssRules[0] as CSSStyleRule).selectorText).toBe(".d");

    group.deleteRule(0);
    expect(group.cssRules.length).toBe(1);

    sheet.deleteRule(idx);
    expect(sheet.cssRules.length).toBe(2);
  });
});

describe("NucloElement _childNodes bookkeeping", () => {
  it("appendChild mirrors into _childNodes when present", () => {
    const el = new NucloElement("div");
    const tracked: unknown[] = [];
    (el as unknown as Record<string, unknown>)["_childNodes"] = tracked;

    const child = new NucloElement("span");
    el.appendChild(child as unknown as Node);

    expect(el.children).toContain(child);
    expect(tracked).toContain(child);
  });

  it("insertBefore mirrors into _childNodes at the reference position", () => {
    const el = new NucloElement("div");
    const ref = new NucloElement("span");
    el.appendChild(ref as unknown as Node);
    const tracked: unknown[] = [ref];
    (el as unknown as Record<string, unknown>)["_childNodes"] = tracked;

    const inserted = new NucloElement("b");
    el.insertBefore(inserted as unknown as Node, ref as unknown as Node);

    expect(el.children[0]).toBe(inserted);
    expect(tracked[0]).toBe(inserted);
    expect(tracked[1]).toBe(ref);
  });
});

describe("NucloElement querySelector — deep descent", () => {
  it("finds a grandchild by class through the recursive branch", () => {
    const root = new NucloElement("div");
    const child = new NucloElement("section");
    const grandchild = new NucloElement("span");
    grandchild.className = "deep";
    child.appendChild(grandchild as unknown as Node);
    root.appendChild(child as unknown as Node);

    expect(root.querySelector(".deep")).toBe(grandchild as unknown as Element);
  });

  it("finds a grandchild by tag through the recursive branch", () => {
    const root = new NucloElement("div");
    const child = new NucloElement("section");
    const grandchild = new NucloElement("em");
    child.appendChild(grandchild as unknown as Node);
    root.appendChild(child as unknown as Node);

    expect(root.querySelector("em")).toBe(grandchild as unknown as Element);
  });
});

describe("NucloElement browser classList", () => {
  it("remove() with no tokens is a no-op", () => {
    const el = new NucloElement("div");
    el.classList.add("keep");
    el.classList.remove();
    expect(el.className).toBe("keep");
  });
});

describe("NucloElement serialization of empty children", () => {
  it("serializes empty text and comment children", () => {
    const el = new NucloElement("div");
    el.appendChild({ nodeType: 3, textContent: "" } as unknown as Node);
    el.appendChild({ nodeType: 8, data: "" } as unknown as Node);

    expect(el.innerHTML).toBe("<!---->");
  });

  it("serializes nested elements containing empty text and comment children", () => {
    const root = new NucloElement("div");
    const inner = new NucloElement("span");
    inner.appendChild({ nodeType: 3, textContent: "" } as unknown as Node);
    inner.appendChild({ nodeType: 8, data: "" } as unknown as Node);
    root.appendChild(inner as unknown as Node);

    expect(root.innerHTML).toBe("<span><!----></span>");
  });

  it("skips children with unknown node types at both levels", () => {
    const root = new NucloElement("div");
    root.appendChild({ nodeType: 7 } as unknown as Node); // processing instruction
    const inner = new NucloElement("span");
    inner.appendChild({ nodeType: 7 } as unknown as Node);
    root.appendChild(inner as unknown as Node);

    expect(root.innerHTML).toBe("<span></span>");
  });

  it("does not duplicate id/class attributes stored via setAttribute", () => {
    const root = new NucloElement("div");
    const inner = new NucloElement("span");
    inner.setAttribute("id", "the-id");
    inner.setAttribute("class", "the-class");
    inner.setAttribute("title", "hello");
    root.appendChild(inner as unknown as Node);

    const html = root.innerHTML;
    expect(html).toBe('<span id="the-id" class="the-class" title="hello"></span>');
  });
});

describe("NucloElement attribute misses", () => {
  it("hasAttribute/getAttribute/removeAttribute on an element with no attributes", () => {
    const el = new NucloElement("div");
    expect(el.hasAttribute("anything")).toBe(false);
    expect(el.getAttribute("anything")).toBeNull();
    expect(() => el.removeAttribute("anything")).not.toThrow();
  });
});

describe("NucloElement DOM mutation misses", () => {
  it("appendChild/insertBefore accept fragments without a children array", () => {
    const el = new NucloElement("div");
    const kid = new NucloElement("span");
    const bareFragment = {
      nodeType: 11,
      childNodes: [kid],
    } as unknown as Node;

    el.appendChild(bareFragment);
    expect(el.children).toContain(kid);

    const el2 = new NucloElement("div");
    const ref = new NucloElement("b");
    el2.appendChild(ref as unknown as Node);
    const kid2 = new NucloElement("i");
    const bareFragment2 = {
      nodeType: 11,
      childNodes: [kid2],
    } as unknown as Node;
    el2.insertBefore(bareFragment2, ref as unknown as Node);
    expect(el2.children[0]).toBe(kid2);
  });

  it("insertBefore with a reference node that is not a child is a no-op", () => {
    const el = new NucloElement("div");
    const ghostRef = new NucloElement("b");
    const node = new NucloElement("i");

    el.insertBefore(node as unknown as Node, ghostRef as unknown as Node);
    expect(el.children.length).toBe(0);
  });

  it("insertBefore tolerates _childNodes that does not track the reference", () => {
    const el = new NucloElement("div");
    const ref = new NucloElement("b");
    el.appendChild(ref as unknown as Node);
    (el as unknown as Record<string, unknown>)["_childNodes"] = []; // ref missing here

    const node = new NucloElement("i");
    el.insertBefore(node as unknown as Node, ref as unknown as Node);

    expect(el.children[0]).toBe(node);
    expect(((el as unknown as Record<string, unknown>)["_childNodes"] as unknown[]).length).toBe(0);
  });

  it("insertBefore accepts plain objects without a parentNode property", () => {
    const el = new NucloElement("div");
    const ref = new NucloElement("b");
    el.appendChild(ref as unknown as Node);

    const bareNode = { nodeType: 3, textContent: "x" } as unknown as Node;
    el.insertBefore(bareNode, ref as unknown as Node);
    expect(el.children[0]).toBe(bareNode);
  });

  it("removeChild misses: not a child, stale _childNodes, no parentNode property", () => {
    const el = new NucloElement("div");
    const ghost = new NucloElement("b");
    expect(() => el.removeChild(ghost as unknown as Node)).not.toThrow();

    const bare = { nodeType: 3, textContent: "x" } as unknown as Node;
    el.appendChild(bare);
    (el as unknown as Record<string, unknown>)["_childNodes"] = []; // bare missing here
    el.removeChild(bare);
    expect(el.children.length).toBe(0);
  });

  it("replaceChild misses: oldChild absent, stale _childNodes, bare nodes", () => {
    const el = new NucloElement("div");
    const ghost = new NucloElement("b");
    const replacement = new NucloElement("i");
    expect(() =>
      el.replaceChild(replacement as unknown as Node, ghost as unknown as Node),
    ).not.toThrow();
    expect(el.children.length).toBe(0);

    // Bare old/new nodes without parentNode, _childNodes missing the child.
    const bareOld = { nodeType: 3, textContent: "old" } as unknown as Node;
    const bareNew = { nodeType: 3, textContent: "new" } as unknown as Node;
    el.appendChild(bareOld);
    (el as unknown as Record<string, unknown>)["_childNodes"] = [];
    el.replaceChild(bareNew, bareOld);
    expect(el.children[0]).toBe(bareNew);
  });
});

describe("NucloElement query misses and non-element children", () => {
  it("querySelector('#missing') descends and returns null", () => {
    const root = new NucloElement("div");
    const child = new NucloElement("section");
    const grandchild = new NucloElement("span");
    grandchild.id = "other";
    child.appendChild(grandchild as unknown as Node);
    child.appendChild({ nodeType: 3, textContent: "txt" } as unknown as Node);
    root.appendChild(child as unknown as Node);

    expect(root.querySelector("#missing")).toBeNull();
    expect(root.querySelectorAll("#missing").length).toBe(0);
  });

  it("querySelectorAll skips text children while collecting classes and tags", () => {
    const root = new NucloElement("div");
    root.className = "hit";
    root.appendChild({ nodeType: 3, textContent: "txt" } as unknown as Node);
    const child = new NucloElement("span");
    child.className = "hit";
    root.appendChild(child as unknown as Node);

    expect(root.querySelectorAll(".hit").length).toBe(2);
    expect(root.querySelectorAll("span").length).toBe(1);
  });
});
