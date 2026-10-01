/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, hydrate, forceUpdate } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr/render-to-string";
import { withServerGlobals } from "../integration/fuzz-harness";
import "../../src";

/**
 * `textContent` / `innerHTML` attributes replace an element's children
 * wholesale while its modifiers run. hydrate() and forceUpdate() reuse the
 * element and afterwards remove "unclaimed" original children — which must not
 * remove the content the attribute just wrote.
 *
 * Also covers hydrating the marker-less content of <title> and <textarea>.
 */
describe("hydrate()/forceUpdate() — elements whose content comes from an attribute", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  /** Server HTML exactly as a Node server produces it (nuclo's SSR polyfill). */
  const ssr = (app: () => unknown): string => withServerGlobals(() => renderToString(app as never));

  describe("textContent", () => {
    it("hydrate() keeps the text (server polyfill HTML)", () => {
      const App = () => div(p({ textContent: "abc" }), span("tail"));
      container.innerHTML = ssr(App);
      const para = container.querySelector("p");

      hydrate(App, container);

      expect(container.querySelector("p")).toBe(para);
      expect(para!.textContent).toBe("abc");
      expect(container.textContent).toBe("abctail");
    });

    it("hydrate() keeps the text (SSR on a real DOM)", () => {
      const App = () => div(p({ textContent: "abc" }));
      container.innerHTML = renderToString(App);
      hydrate(App, container);
      expect(container.textContent).toBe("abc");
    });

    it("hydrate() patches a server/client mismatch", () => {
      let text = "server";
      const App = () => div(p({ textContent: text }));
      container.innerHTML = ssr(App);
      text = "client";
      hydrate(App, container);
      expect(container.textContent).toBe("client");
    });

    it("forceUpdate() keeps and refreshes the text", () => {
      let text = "abc";
      const App = () => div(p({ textContent: text }));
      render(App, container);
      const para = container.querySelector("p");

      forceUpdate();
      expect(container.textContent).toBe("abc");

      text = "xyz";
      forceUpdate();
      forceUpdate();
      expect(container.querySelector("p")).toBe(para);
      expect(container.textContent).toBe("xyz");
    });

    it("a reactive textContent stays reactive after hydrate() and forceUpdate()", () => {
      let text = "one";
      const App = () => div(p({ textContent: () => text }));
      container.innerHTML = ssr(App);
      hydrate(App, container);
      expect(container.textContent).toBe("one");

      text = "two";
      update();
      expect(container.textContent).toBe("two");

      forceUpdate();
      expect(container.textContent).toBe("two");
      text = "three";
      update();
      expect(container.textContent).toBe("three");
    });

    it("an empty string clears previously rendered text", () => {
      let text = "abc";
      const App = () => div(p({ textContent: text }));
      render(App, container);
      text = "";
      forceUpdate();
      expect(container.textContent).toBe("");
    });
  });

  describe("innerHTML", () => {
    it("hydrate() keeps the markup (server polyfill HTML)", () => {
      const App = () => div(article({ innerHTML: "<b>bold</b> text" }), span("tail"));
      container.innerHTML = ssr(App);
      expect(container.querySelector("article")!.innerHTML).toBe("<b>bold</b> text");

      hydrate(App, container);

      expect(container.querySelector("article")!.innerHTML).toBe("<b>bold</b> text");
      expect(container.textContent).toBe("bold texttail");
    });

    it("forceUpdate() keeps and refreshes the markup", () => {
      let html = "<b>bold</b> text";
      const App = () => div(article({ innerHTML: html }));
      render(App, container);
      const el = container.querySelector("article");

      forceUpdate();
      expect(el!.innerHTML).toBe("<b>bold</b> text");

      html = "<i>new</i>";
      forceUpdate();
      expect(container.querySelector("article")).toBe(el);
      expect(el!.innerHTML).toBe("<i>new</i>");
    });

    it("a reactive innerHTML stays reactive after hydrate() and forceUpdate()", () => {
      let html = "<b>1</b>";
      const App = () => div(article({ innerHTML: () => html }));
      container.innerHTML = ssr(App);
      hydrate(App, container);
      html = "<b>2</b>";
      update();
      expect(container.querySelector("article")!.innerHTML).toBe("<b>2</b>");
      forceUpdate();
      html = "<b>3</b>";
      update();
      expect(container.querySelector("article")!.innerHTML).toBe("<b>3</b>");
    });

    it("many content elements in a hydrated list all keep their markup", () => {
      const items = Array.from({ length: 50 }, (_, i) => ({ id: i, html: `<em>${i}</em>!` }));
      const App = () => ul(list(() => items, (it) => li({ innerHTML: it.html })));
      container.innerHTML = ssr(App);
      const rowsBefore = Array.from(container.querySelectorAll("li"));

      hydrate(App, container);
      forceUpdate();

      const rows = Array.from(container.querySelectorAll("li"));
      expect(rows.length).toBe(50);
      rows.forEach((row, i) => {
        expect(row).toBe(rowsBefore[i]);
        expect(row.innerHTML).toBe(`<em>${i}</em>!`);
      });
    });
  });

  describe("unclaimed children are still removed around such elements", () => {
    it("extra server children of an ordinary sibling are cleaned up", () => {
      const App = () => div(p({ textContent: "kept" }), section(span("only")));
      container.innerHTML = "<div><p>kept</p><section><span><!-- text-0 -->only</span><i>stale</i><b>stale</b></section></div>";
      hydrate(App, container);
      expect(container.querySelector("i")).toBeNull();
      expect(container.querySelector("b")).toBeNull();
      expect(container.textContent).toBe("keptonly");
    });

    it("forceUpdate() still removes nodes the new tree no longer produces", () => {
      let extra = true;
      const App = () => div(span("a"), extra ? span("b") : null, extra ? "tail" : null);
      render(App, container);
      extra = false;
      forceUpdate();
      expect(container.querySelectorAll("span").length).toBe(1);
      expect(container.textContent).toBe("a");
    });
  });

  describe("<title> and <textarea> (server HTML carries no text markers)", () => {
    it("<title>: hydrates static text and stays correct", () => {
      const App = () => div(title("Home"));
      container.innerHTML = ssr(App);
      const el = container.querySelector("title")!;
      expect(el.textContent).toBe("Home");

      hydrate(App, container);

      expect(container.querySelector("title")).toBe(el);
      expect(el.text).toBe("Home");
    });

    it("<title>: reactive text updates after hydration", () => {
      let page = "Home";
      const App = () => div(title(() => page, " | Site"));
      container.innerHTML = ssr(App);
      const el = container.querySelector("title")!;
      hydrate(App, container);
      expect(el.text).toBe("Home | Site");

      page = "About";
      update();
      expect(el.text).toBe("About | Site");

      forceUpdate();
      page = "Contact";
      update();
      expect(el.text).toBe("Contact | Site");
    });

    it("<textarea>: text children hydrate into the same value", () => {
      let text = "hello";
      const App = () => div(textarea(() => text));
      container.innerHTML = ssr(App);
      const el = container.querySelector("textarea")!;
      expect(el.value).toBe("hello");

      hydrate(App, container);
      expect(container.querySelector("textarea")).toBe(el);
      expect(el.value).toBe("hello");

      text = "changed";
      update();
      expect(el.defaultValue).toBe("changed");
    });

    it("<textarea>: { value } hydrates and stays reactive", () => {
      let text = "v1";
      const App = () => div(textarea({ value: () => text }));
      container.innerHTML = ssr(App);
      const el = container.querySelector("textarea")!;
      expect(el.value).toBe("v1");

      hydrate(App, container);
      expect(el.value).toBe("v1");
      text = "v2";
      update();
      expect(el.value).toBe("v2");
    });
  });
});
