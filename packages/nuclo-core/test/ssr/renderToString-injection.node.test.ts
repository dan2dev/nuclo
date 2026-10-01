/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import "../../src/polyfill";
import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";
import { renderToString, renderToStringWithContainer } from "../../src/ssr/render-to-string";
import "../../src";

/**
 * Server output is parsed by a browser, so anything the app passes through —
 * text, attribute values, attribute *names*, comment nodes — must not be able
 * to end its own construct and continue as markup. In the browser the DOM API
 * guarantees that (setAttribute() rejects bad names, a Comment node is just a
 * node); the serializer has to guarantee it for the server.
 *
 * Every case is judged by what a real HTML parser builds from the output.
 */
const parse = (html: string): Document => new JSDOM(`<!doctype html><body>${html}</body>`).window.document;
const untyped = <T>(value: T): never => value as never;

describe("renderToString — markup cannot be injected", () => {
  describe("attribute names", () => {
    const PAYLOADS = [
      "x><script>alert(1)</script><i y",
      'onmouseover="alert(1)" z',
      "a b",
      "a\tb",
      "a\nb",
      "a/b",
      "a=b",
      "a'b",
      "a<b",
      "a\u0000b",
      "",
    ];

    for (const name of PAYLOADS) {
      it(`drops the attribute named ${JSON.stringify(name)}`, () => {
        const html = renderToString(div(untyped({ [name]: "v", id: "safe", "data-kept": "yes" }), "text"));
        const doc = parse(html);
        const el = doc.body.firstElementChild!;
        expect(doc.querySelector("script")).toBeNull();
        expect(doc.body.children.length).toBe(1);
        expect(el.tagName).toBe("DIV");
        expect(el.getAttributeNames().sort()).toEqual(["data-kept", "id"]);
        expect(el.textContent).toBe("text");
      });
    }

    it("keeps unusual but valid names", () => {
      const html = renderToString(div(untyped({ "data-a.b": "1", "aria-label": "l", "xlink:href": "#x", "@click": "go", "x-on:keyup.enter": "run", "_private": "p" })));
      const el = parse(html).body.firstElementChild!;
      expect(el.getAttributeNames().sort()).toEqual(["@click", "_private", "aria-label", "data-a.b", "x-on:keyup.enter", "xlink:href"]);
    });

    it("stays correct when thousands of distinct names pass through", () => {
      for (let k = 0; k < 3000; k++) {
        const html = renderToString(div(untyped({ [`data-k${k}`]: String(k), [`bad ${k}>`]: "x" })));
        if (html !== `<div data-k${k}="${k}"></div>`) throw new Error(`unexpected output for ${k}: ${html}`);
      }
      // …and known names still map as before afterwards.
      expect(renderToString(label({ htmlFor: "f", tabIndex: 2 }))).toBe('<label for="f" tabindex="2"></label>');
    });

    it("SVG attribute names are checked too, and keep their case", () => {
      const html = renderToString(svgSvg(untyped({ viewBox: "0 0 1 1", "x><script>": "1" })));
      expect(html).toBe('<svg viewBox="0 0 1 1"></svg>');
    });

    it("container attributes of renderToStringWithContainer are checked", () => {
      const html = renderToStringWithContainer(div("x"), "main", { id: "app", 'a"><script>alert(1)</script>': "v" });
      const doc = parse(html);
      expect(doc.querySelector("script")).toBeNull();
      expect(doc.querySelector("main")!.getAttributeNames()).toEqual(["id"]);
    });
  });

  describe("attribute values and text", () => {
    it("values cannot close their quotes", () => {
      const evil = '"><script>alert(1)</script><i a="';
      const html = renderToString(a({ href: evil, title: evil, "data-x": evil, className: evil, id: evil }, evil));
      const doc = parse(html);
      const el = doc.querySelector("a")!;
      expect(doc.querySelector("script")).toBeNull();
      expect(el.getAttribute("href")).toBe(evil);
      expect(el.getAttribute("title")).toBe(evil);
      expect(el.getAttribute("data-x")).toBe(evil);
      expect(el.id).toBe(evil);
      expect(el.textContent).toBe(evil);
    });

    it("style values cannot add attributes", () => {
      const html = renderToString(div({ style: { color: 'red;" onclick="alert(1)' } }));
      const el = parse(html).body.firstElementChild!;
      expect(el.getAttributeNames()).toEqual(["style"]);
    });

    it("reactive text and list items are escaped like static text", () => {
      const evil = "<img src=x onerror=alert(1)>";
      const html = renderToString(ul(() => evil, list(() => [evil], (item) => li(item))));
      const doc = parse(html);
      expect(doc.querySelector("img")).toBeNull();
      expect(doc.querySelector("li")!.textContent).toBe(evil);
    });
  });

  describe("comment nodes the app supplies", () => {
    const PAYLOADS = [
      "x --> <script>alert(1)</script>",
      "> <script>alert(1)</script>",
      "-> <script>alert(1)</script>",
      "x --!> <script>alert(1)</script>",
      "--><script>alert(1)</script><!--",
    ];

    for (const data of PAYLOADS) {
      it(`a comment containing ${JSON.stringify(data)} stays one comment`, () => {
        const html = renderToString(div(untyped(document.createComment(data)), span("after")));
        const doc = parse(html);
        const root = doc.body.firstElementChild!;
        expect(doc.querySelector("script")).toBeNull();
        expect(Array.from(root.childNodes).map((n) => n.nodeType)).toEqual([8, 1]);
        expect(root.querySelector("span")!.textContent).toBe("after");
      });
    }

    it("harmless comments are emitted unchanged", () => {
      expect(renderToString(div(untyped(document.createComment(" build 42 "))))).toBe("<div><!-- build 42 --></div>");
    });

    it("nuclo's own markers are untouched", () => {
      const html = renderToString(div("a", when(() => true, b("w")), list(() => [1], (n) => i(String(n)))));
      expect(html).toBe("<div><!-- text-0 -->a<!--when-start-1-b0--><b><!-- text-1 -->w</b><!--when-end--><!--list-start-2--><i><!-- text-0 -->1</i><!--list-end--></div>");
    });
  });
});
