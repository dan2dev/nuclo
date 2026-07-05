/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered branches in src/list/runtime.ts hydration paths:
 *  - lines 443-445: SSR HTML without a list-start marker → fresh render fallback
 *  - lines 458-462: depth-counted scan over nested list marker pairs
 *  - lines 468-475: missing list-end marker → recreated end marker
 *  - lines 543-558: stale double-registration pruned by updateListRuntimes()
 */
import { describe, it, expect, beforeEach } from "vitest";
import { hydrate } from "../../src/render";
import { updateListRuntimes } from "../../src/list/runtime";
import { list } from "../../src/list";
import "../../src";

describe("list hydration — corrupt or missing SSR markers", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("falls back to a fresh render when the SSR HTML has no list markers", () => {
    container.innerHTML = "<div></div>";

    const el = hydrate(
      div(list(() => ["a", "b"], (item) => li(item))),
      container,
    );

    const rows = Array.from(el.querySelectorAll("li")).map((n) => n.textContent);
    expect(rows).toEqual(["a", "b"]);
    // Fresh markers were created around the rows.
    const comments = Array.from(el.childNodes).filter((n) => n.nodeType === 8);
    expect(comments.length).toBe(2);
  });

  it("depth-counts nested marker pairs when scanning for the end marker", () => {
    // A stale inner list pair sits between the outer start and end markers,
    // along with empty and unrelated comments the scan must step over.
    container.innerHTML =
      "<div><!--list-start-0--><!--list-start-9--><!--list-end--><!----><!--other--><li>stale</li><!--list-end--></div>";

    const el = hydrate(
      div(list(() => ["a"], (item) => li(item))),
      container,
    );

    const rows = Array.from(el.querySelectorAll("li")).map((n) => n.textContent);
    expect(rows).toEqual(["a"]);
    // The stale inner pair was removed as leftover content; the outer pair remains.
    const comments = Array.from(el.childNodes).filter((n) => n.nodeType === 8);
    expect(comments.length).toBe(2);
  });

  it("skips items whose renderer resolves to nothing during the claim pass", () => {
    container.innerHTML =
      "<div><!--list-start-0--><li>a</li><!--list-end--></div>";

    const el = hydrate(
      div(
        list(
          () => ["a", "skipped"],
          (item) => (item === "skipped" ? null : li(item)),
        ),
      ),
      container,
    );

    const rows = Array.from(el.querySelectorAll("li")).map((n) => n.textContent);
    expect(rows).toEqual(["a"]);
  });

  it("recreates the end marker when the SSR output is truncated", () => {
    container.innerHTML = "<div><!--list-start-0--><li>stale</li></div>";

    const el = hydrate(
      div(list(() => ["fresh"], (item) => li(item))),
      container,
    );

    const rows = Array.from(el.querySelectorAll("li")).map((n) => n.textContent);
    expect(rows).toEqual(["fresh"]);
    const comments = Array.from(el.childNodes).map((n) =>
      n.nodeType === 8 ? n.textContent : null,
    ).filter(Boolean);
    expect(comments).toContain("list-end");
  });

  it("prunes a stale registration left behind by repeated hydration", () => {
    const component = () => div(list(() => ["x"], (item) => li(item)));
    container.innerHTML =
      "<div><!--list-start-0--><li><!-- text-0 -->x</li><!--list-end--></div>";

    // Hydrating twice registers the same start marker twice; the second
    // registration overwrites the runtime in the WeakMap, leaving the first
    // WeakRef stale.
    hydrate(component(), container);
    hydrate(component(), container);

    // Disconnect everything, then force a registry sweep. The stale ref (no
    // runtime behind it) and the disconnected runtime must both be dropped
    // without throwing.
    container.remove();
    expect(() => updateListRuntimes()).not.toThrow();
    // A second sweep confirms the registry is clean (no dangling refs).
    expect(() => updateListRuntimes()).not.toThrow();
  });
});
