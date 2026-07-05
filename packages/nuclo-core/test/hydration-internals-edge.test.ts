/// <reference path="../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered branches in src/hydration.ts and src/render.ts:
 *  - cleanupUnclaimedChildren with a null lastOriginalChild (early return)
 *  - cleanupUnclaimedChildren removing multiple unclaimed nodes before the boundary
 *  - skipWhitespaceText over empty text nodes (textContent === "" fallback)
 *  - hydrate() defaulting to document.body when no parent is given
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  cleanupUnclaimedChildren,
  skipWhitespaceText,
  peekChild,
  setCursor,
  claimChild,
} from "../src/hydration";
import { hydrate } from "../src/render";
import { renderToString } from "../src/ssr/render-to-string";
import "../src";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("cleanupUnclaimedChildren", () => {
  it("returns immediately when lastOriginalChild is null", () => {
    const parent = document.createElement("div");
    parent.appendChild(document.createElement("span"));
    parent.appendChild(document.createElement("b"));

    cleanupUnclaimedChildren(parent, null);

    // Nothing removed — the element had no original children boundary.
    expect(parent.childNodes.length).toBe(2);
  });

  it("removes every unclaimed node up to and including the boundary", () => {
    const parent = document.createElement("div");
    const a = document.createElement("span");
    const b = document.createElement("b");
    const c = document.createElement("i");
    parent.append(a, b, c);

    // Cursor at default (firstChild); boundary is the last original child.
    cleanupUnclaimedChildren(parent, c);

    expect(parent.childNodes.length).toBe(0);
    expect(peekChild(parent)).toBeNull();
  });

  it("preserves nodes appended after the boundary", () => {
    const parent = document.createElement("div");
    const stale1 = document.createElement("span");
    const stale2 = document.createElement("b");
    parent.append(stale1, stale2);
    // Simulate modifiers appending fresh content after the original boundary.
    const fresh = document.createElement("p");
    parent.appendChild(fresh);

    cleanupUnclaimedChildren(parent, stale2);

    expect(parent.childNodes.length).toBe(1);
    expect(parent.firstChild).toBe(fresh);
  });

  it("stops at the boundary even when the cursor is mid-list", () => {
    const parent = document.createElement("div");
    const claimed = document.createElement("u");
    const stale = document.createElement("span");
    const boundary = document.createElement("b");
    const after = document.createElement("p");
    parent.append(claimed, stale, boundary, after);
    setCursor(parent, stale);

    cleanupUnclaimedChildren(parent, boundary);

    expect(Array.from(parent.childNodes)).toEqual([claimed, after]);
  });
});

describe("claimChild", () => {
  it("returns null and leaves the cursor untouched on an empty parent", () => {
    const parent = document.createElement("div");
    expect(claimChild(parent)).toBeNull();
    expect(peekChild(parent)).toBeNull();
  });
});

describe("skipWhitespaceText", () => {
  it("skips empty text nodes (textContent === '')", () => {
    const parent = document.createElement("div");
    const empty = document.createTextNode("");
    const el = document.createElement("span");
    parent.append(empty, el);
    setCursor(parent, empty);

    skipWhitespaceText(parent);

    expect(peekChild(parent)).toBe(el);
    // Nodes are skipped, not removed.
    expect(parent.childNodes.length).toBe(2);
  });

  it("does not advance past non-whitespace text", () => {
    const parent = document.createElement("div");
    const text = document.createTextNode("content");
    parent.append(text);
    setCursor(parent, text);

    skipWhitespaceText(parent);

    expect(peekChild(parent)).toBe(text);
  });
});

describe("hydrate() without an explicit parent", () => {
  it("hydrates against document.body by default", () => {
    const component = () => div(span("hello"));
    document.body.innerHTML = renderToString(component());
    const existing = document.body.firstElementChild!;

    const el = hydrate(component());

    expect(el).toBe(existing);
    expect(document.body.children.length).toBe(1);
  });

  it("claims an empty element without touching it (null lastChild boundary)", () => {
    document.body.innerHTML = "<div></div>";
    const existing = document.body.firstElementChild!;

    const el = hydrate(div(), document.body as unknown as Element);

    expect(el).toBe(existing);
    expect(el.childNodes.length).toBe(0);
  });
});
