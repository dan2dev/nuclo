/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, hydrate, forceUpdate } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr/render-to-string";
import "../../src";

/**
 * forceUpdate() reuses text nodes positionally. When the tree shifts between
 * builds (`cond ? "x" : null` children), a node that used to be reactive may
 * be claimed by a static text, and a whitespace-only text child may end up
 * where the new tree expects an element. Neither may leak into the next
 * update().
 */
describe("forceUpdate() — text children when the tree shifts", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  describe("static text claiming a previously reactive node", () => {
    it("the stale resolver no longer writes into it (client-rendered tree)", () => {
      let show = false;
      let text = "r1";
      const App = () => div(show ? "static" : null, () => text);

      render(App, container);
      expect(container.textContent).toBe("r1");

      show = true;
      forceUpdate();
      expect(container.textContent).toBe("staticr1");

      text = "r2";
      update();
      expect(container.textContent).toBe("staticr2");

      text = "r3";
      update();
      expect(container.textContent).toBe("staticr3");
    });

    it("the stale resolver no longer writes into it (server-rendered tree)", () => {
      let show = false;
      let text = "r1";
      const App = () => div(show ? "static" : null, () => text);

      container.innerHTML = renderToString(App);
      hydrate(App, container);

      show = true;
      forceUpdate();
      text = "r2";
      update();
      expect(container.textContent).toBe("staticr2");
    });

    it("several reactive texts shifting by one position stay bound to their own resolver", () => {
      let lead = false;
      let a = "A";
      let b = "B";
      const App = () => div(lead ? () => "L" : null, () => a, "|", () => b);

      render(App, container);
      lead = true;
      forceUpdate();
      expect(container.textContent).toBe("LA|B");

      a = "a2";
      b = "b2";
      update();
      expect(container.textContent).toBe("La2|b2");

      lead = false;
      forceUpdate();
      a = "a3";
      b = "b3";
      update();
      expect(container.textContent).toBe("a3|b3");
    });

    it("whitespace / empty reactive values survive repeated shifts", () => {
      let lead = false;
      let t1 = "  padded  ";
      const t2 = "x";
      const App = () => div(lead ? () => t2 : null, () => t1, "", () => t1);

      render(App, container);
      expect(container.textContent).toBe("  padded    padded  ");

      lead = true;
      forceUpdate();
      t1 = " ";
      update();
      expect(container.textContent).toBe("x  ");

      lead = false;
      forceUpdate();
      expect(container.textContent).toBe("  ");

      t1 = "y";
      update();
      expect(container.textContent).toBe("yy");

      lead = true;
      forceUpdate();
      t1 = "";
      update();
      expect(container.textContent).toBe("x");
    });
  });

  describe("whitespace-only text the new tree no longer produces", () => {
    it("is removed when an element is expected at its position", () => {
      let lead = true;
      const App = () => div(lead ? " " : null, span("x"));

      render(App, container);
      const root = container.firstElementChild!;
      const spanEl = root.querySelector("span");
      expect(root.childNodes.length).toBe(2);

      lead = false;
      forceUpdate();

      expect(root.childNodes.length).toBe(1);
      expect(root.firstChild).toBe(spanEl);
    });

    it("is removed when a when()/list() block is expected at its position", () => {
      let lead = true;
      const items = [1, 2];
      const App = () => div(lead ? "" : null, when(() => true, b("w")), lead ? "  " : null, list(() => items, (n) => i(String(n))));

      render(App, container);
      lead = false;
      forceUpdate();

      const root = container.firstElementChild!;
      const textNodes = Array.from(root.childNodes).filter((n) => n.nodeType === 3);
      expect(textNodes.length).toBe(0);
      expect(root.textContent).toBe("w12");
    });

    it("comes back when the tree produces it again", () => {
      let lead = true;
      const App = () => div(span("a"), lead ? " " : null, span("b"));

      render(App, container);
      lead = false;
      forceUpdate();
      expect(container.textContent).toBe("ab");
      lead = true;
      forceUpdate();
      expect(container.textContent).toBe("a b");
      const root = container.firstElementChild!;
      expect(Array.from(root.childNodes).filter((n) => n.nodeType === 3).length).toBe(1);
      expect(root.querySelectorAll("span").length).toBe(2);

      // ...and toggling keeps converging instead of accumulating nodes.
      for (let round = 0; round < 4; round++) {
        lead = !lead;
        forceUpdate();
      }
      expect(container.textContent).toBe("a b");
      expect(Array.from(root.childNodes).filter((n) => n.nodeType === 3).length).toBe(1);
      expect(root.querySelectorAll("span").length).toBe(2);
    });

    it("a reactive whitespace text dropped this way is unregistered", () => {
      let lead = true;
      let pad = " ";
      const App = () => div(lead ? () => pad : null, span("x"));

      render(App, container);
      const stale = container.firstElementChild!.firstChild!;
      lead = false;
      forceUpdate();
      expect(stale.parentNode).toBeNull();

      pad = "changed";
      update();
      expect(stale.textContent).toBe(" ");
      expect(container.textContent).toBe("x");
    });
  });

  describe("the app's container is never touched", () => {
    it("forceUpdate(tree, parent) keeps template whitespace around the root", () => {
      let label = "one";
      const App = () => div(span(label));

      container.innerHTML = "\n  ";
      render(App(), container);
      container.appendChild(document.createTextNode("\n"));
      const leading = container.firstChild;
      const trailing = container.lastChild;
      const root = container.firstElementChild;

      label = "two";
      forceUpdate(App(), container);

      expect(container.firstChild).toBe(leading);
      expect(container.lastChild).toBe(trailing);
      expect(container.firstElementChild).toBe(root);
      expect(container.childNodes.length).toBe(3);
      expect(root!.textContent).toBe("two");
    });

    it("bare forceUpdate() keeps whitespace and foreign siblings around the root", () => {
      let label = "one";
      const App = () => div(span(label));

      container.innerHTML = "\n  <header>site</header>\n  ";
      render(App, container);
      const snapshot = Array.from(container.childNodes);

      label = "two";
      forceUpdate();

      expect(Array.from(container.childNodes)).toEqual(snapshot);
      expect(container.lastElementChild!.textContent).toBe("two");
    });

    it("hydrate() leaves formatter whitespace inside the tree in place", () => {
      const App = () => div(span("a"), span("b"));
      container.innerHTML = "<div>\n  <span><!-- text-0 -->a</span>\n  <span><!-- text-0 -->b</span>\n</div>";
      const root = container.firstElementChild!;
      const [leading, , between] = Array.from(root.childNodes);

      hydrate(App, container);

      // Whitespace in front of claimed nodes is skipped, never removed.
      expect(root.childNodes[0]).toBe(leading);
      expect(root.childNodes[2]).toBe(between);
      expect(root.querySelectorAll("span").length).toBe(2);
    });
  });
});
