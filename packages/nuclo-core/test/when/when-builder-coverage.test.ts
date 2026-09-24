/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { when } from "../../src/when";
import { updateWhenRuntimes } from "../../src/when/runtime";
import { update } from "../../src/update/update";

describe("when builder chaining", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("renders a start comment marker", () => {
    const marker = when(() => true, "content")(container as ExpandedElement<"div">, 0);
    expect(marker).toBeInstanceOf(Comment);
    expect((marker as Comment).textContent).toContain("when");
  });

  it("renders the first matching condition across chained when() calls", () => {
    when(() => false, "content1")
      .when(() => false, "content2")
      .when(() => true, "content3")(container as ExpandedElement<"div">, 0);
    expect(container.textContent).toBe("content3");
  });

  it("renders else content when no condition matches", () => {
    when(() => false, "content").else("else content")(container as ExpandedElement<"div">, 0);
    expect(container.textContent).toBe("else content");
  });

  it("keeps the else branch when when() is chained after else()", () => {
    when(() => false, "1").when(() => false, "2").else("else").when(() => false, "3")(
      container as ExpandedElement<"div">,
      0,
    );
    expect(container.textContent).toBe("else");
  });

  it("uses the last else() when called twice", () => {
    when(() => false, "initial").else("first else").else("second else")(container as ExpandedElement<"div">, 0);
    expect(container.textContent).toBe("second else");
  });

  it("renders nothing for an empty branch or an empty else", () => {
    when(() => false, "initial").when(() => true)(container as ExpandedElement<"div">, 0);
    when(() => false, "initial").else()(container as ExpandedElement<"div">, 1);
    updateWhenRuntimes();
    expect(container.textContent).toBe("");
  });

  it("returns a new builder on every chain call and never mutates the original", () => {
    const base = when(() => false, "base");
    const withWhen = base.when(() => true, "chained");
    const withElse = base.else("else");

    expect(withWhen).not.toBe(base);
    expect(withElse).not.toBe(base);
    expect(withElse).not.toBe(withWhen);

    const a = document.createElement("div");
    const b = document.createElement("div");
    const c = document.createElement("div");
    container.append(a, b, c);
    base(a as ExpandedElement<"div">, 0);
    withWhen(b as ExpandedElement<"div">, 0);
    withElse(c as ExpandedElement<"div">, 0);

    expect(a.textContent).toBe("");
    expect(b.textContent).toBe("chained");
    expect(c.textContent).toBe("else");
  });

  it("gives every render of one builder its own runtime", () => {
    let flag = false;
    const block = when(() => flag, "on").else("off");
    const a = document.createElement("div");
    const b = document.createElement("div");
    container.append(a, b);
    block(a as ExpandedElement<"div">, 0);
    block(b as ExpandedElement<"div">, 0);
    expect(a.textContent).toBe("off");
    expect(b.textContent).toBe("off");

    flag = true;
    update();
    expect(a.textContent).toBe("on");
    expect(b.textContent).toBe("on");

    // Removing one rendering leaves the other live.
    a.remove();
    flag = false;
    update();
    expect(b.textContent).toBe("off");
  });

  it("passes the modifier index through to the start marker", () => {
    const marker = when(() => true, "x")(container as ExpandedElement<"div">, 5) as Comment;
    expect(marker.textContent).toBe("when-start-5-b0");
  });
});
