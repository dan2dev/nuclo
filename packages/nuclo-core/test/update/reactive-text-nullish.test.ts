/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { hydrate } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr/render-to-string";
import "../../src";

/**
 * Nullish reactive text — a zero-arity modifier whose resolver returns
 * null/undefined at mount time (data not loaded yet) must register as an
 * empty reactive text node, not be dropped. Later update() calls fill the
 * value in, and values that become nullish again render as "" — never the
 * strings "null"/"undefined".
 */
describe("reactive text — nullish resolvers", () => {
  const state: { name: string | null | undefined } = { name: undefined };

  beforeEach(() => {
    document.body.innerHTML = "";
    state.name = undefined;
  });

  function mount(el: unknown): HTMLElement {
    const node = el as HTMLElement;
    document.body.appendChild(node);
    return node;
  }

  it("renders empty for an initially-undefined resolver and fills in after update()", () => {
    const el = mount(div(() => state.name)(document.body as unknown as ExpandedElement<"div">));

    expect(el.textContent).toBe("");

    state.name = "Ada";
    update();

    expect(el.textContent).toBe("Ada");
  });

  it("renders empty for an initially-null resolver and fills in after update()", () => {
    state.name = null;
    const el = mount(div(() => state.name)(document.body as unknown as ExpandedElement<"div">));

    expect(el.textContent).toBe("");

    state.name = "Grace";
    update();

    expect(el.textContent).toBe("Grace");
  });

  it("renders empty (not 'null') when a value becomes nullish again", () => {
    state.name = "Ada";
    const el = mount(div(() => state.name)(document.body as unknown as ExpandedElement<"div">));

    expect(el.textContent).toBe("Ada");

    state.name = null;
    update();
    expect(el.textContent).toBe("");

    state.name = undefined;
    update();
    expect(el.textContent).toBe("");
  });

  it("keeps sibling order and static text intact around a nullish resolver", () => {
    const other = { value: "right" };
    const el = mount(
      div(() => state.name, " | ", () => other.value)(document.body as unknown as ExpandedElement<"div">),
    );

    expect(el.textContent).toBe(" | right");

    state.name = "left";
    update();

    expect(el.textContent).toBe("left | right");
  });

  describe("SSR + hydration", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement("div");
      container.id = "app";
      document.body.appendChild(container);
    });

    // Server and client build their trees from separate closures, like real
    // SSR (separate processes) — the probe cache must not leak between them.
    function app(): DetachedExpandedElementFactory<"div"> {
      return div(() => state.name);
    }

    it("emits a hydratable marker for a nullish SSR value and converges on the client value", () => {
      state.name = undefined;
      const html = renderToString(app());
      expect(html).toContain("<!-- text-0 -->");

      container.innerHTML = html;

      state.name = "Ada";
      const el = hydrate(app(), container) as unknown as HTMLElement;

      expect(el.textContent).toBe("Ada");

      // Reactivity must survive hydration.
      state.name = "Grace";
      update();
      expect(el.textContent).toBe("Grace");
    });

    it("patches an SSR value down to empty when the client resolver is nullish at hydration", () => {
      state.name = "server";
      const html = renderToString(app());
      expect(html).toContain("server");

      container.innerHTML = html;

      state.name = undefined;
      const el = hydrate(app(), container) as unknown as HTMLElement;

      expect(el.textContent).toBe("");

      state.name = "client";
      update();
      expect(el.textContent).toBe("client");
    });
  });
});
