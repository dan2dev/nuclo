/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderToString } from "../../src/ssr/render-to-string";
import "../../src";

/**
 * Same guarantee as renderToString-injection.node.test.ts, for SSR running on
 * a real DOM (jsdom / happy-dom): a Comment node whose data contains "-->"
 * must not be able to end the comment in the serialized HTML.
 */
describe("renderToString on a real DOM — comment nodes cannot break out", () => {
  it("escapes '>' in an app-supplied comment", () => {
    const html = renderToString(div(document.createComment("x --> <script>alert(1)</script>") as never, span("after")));
    const host = document.createElement("div");
    host.innerHTML = html;
    expect(host.querySelector("script")).toBeNull();
    expect(Array.from(host.firstElementChild!.childNodes).map((n) => n.nodeType)).toEqual([8, 1]);
  });

  it("serializing an existing element with such a comment is safe too", () => {
    const el = document.createElement("section");
    el.appendChild(document.createComment("--><img src=x onerror=alert(1)>"));
    const host = document.createElement("div");
    host.innerHTML = renderToString(el);
    expect(host.querySelector("img")).toBeNull();
  });

  it("marker comments still round-trip for hydration", () => {
    const html = renderToString(div("a", when(() => true, "b")));
    expect(html).toBe("<div><!-- text-0 -->a<!--when-start-1-b0--><!-- text-1 -->b<!--when-end--></div>");
  });
});
