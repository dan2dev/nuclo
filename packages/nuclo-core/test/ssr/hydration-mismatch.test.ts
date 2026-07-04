/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { hydrate } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr/render-to-string";
import { when } from "../../src/when";
import { list } from "../../src/list";
import "../../src";

/**
 * Hydration edge cases — server/client mismatches and SSR output quirks.
 *
 * SSR HTML and the client component tree can legitimately diverge:
 * data changed between render and hydration, the HTML passed through a
 * formatter/minifier, or a value rendered to an empty string (which the
 * HTML parser drops entirely). Hydration must converge on the client
 * render result in every one of these cases — never duplicate nodes,
 * never leave stale server content, never corrupt sibling claims.
 */
describe("hydration — mismatch and edge cases", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
  });

  function injectSsr(html: string): void {
    container.innerHTML = html;
  }

  // =========================================================================
  // Root attachment
  // =========================================================================
  describe("root attachment", () => {
    it("attaches the root element when the container is empty", () => {
      injectSsr('');

      const el = hydrate(div("Hello"), container);

      expect(el.parentNode).toBe(container);
      expect(container.textContent).toContain('Hello');
    });

    it("replaces a mismatched root instead of leaving both", () => {
      injectSsr('<span>Hello</span>');

      const el = hydrate(div("Hello"), container);

      expect(el.parentNode).toBe(container);
      expect(container.querySelector('span')).toBeNull();
      expect(container.children.length).toBe(1);
      expect(container.textContent).toBe('Hello');
    });

    it("hydrated root from matching SSR stays attached and unique", () => {
      injectSsr(renderToString(div("Hello")));

      const el = hydrate(div("Hello"), container);

      expect(el.parentNode).toBe(container);
      expect(container.children.length).toBe(1);
    });
  });

  // =========================================================================
  // Whitespace from templates/formatters
  // =========================================================================
  describe("whitespace tolerance", () => {
    it("claims the root despite surrounding template whitespace", () => {
      injectSsr('\n  ' + renderToString(div(span("x"))) + '\n');

      const existingRoot = container.querySelector('div')!;
      const el = hydrate(div(span("x")), container);

      expect(el).toBe(existingRoot);
      expect(container.querySelectorAll('div').length).toBe(1);
      expect(container.querySelectorAll('span').length).toBe(1);
    });

    it("tolerates whitespace between SSR children (pretty-printed HTML)", () => {
      injectSsr('<div>\n  <span><!-- text-0 -->a</span>\n  <span><!-- text-0 -->b</span>\n</div>');

      const el = hydrate(div(span("a"), span("b")), container);

      expect(el.querySelectorAll('span').length).toBe(2);
      expect(el.textContent!.replace(/\s+/g, '')).toBe('ab');
    });
  });

  // =========================================================================
  // Empty-string text — parser drops the empty text node
  // =========================================================================
  describe("empty-string text", () => {
    it("static empty string does not desynchronize sibling claims", () => {
      // renderToString(div("", span("x"))) emits <!-- text-0 --> with NO text
      // node after it; innerHTML parsing therefore has no text node to claim.
      const html = renderToString(div("", span("x")));
      injectSsr(html);

      const ssrSpan = container.querySelector('span')!;
      const el = hydrate(div("", span("x")), container);

      expect(el.querySelectorAll('span').length).toBe(1);
      expect(el.querySelector('span')).toBe(ssrSpan);
    });

    it("reactive text that starts empty stays reactive after hydration", () => {
      let msg = "";
      const component = () => div(() => msg, span("tail"));

      injectSsr(renderToString(component()));
      const ssrSpan = container.querySelector('span')!;

      const el = hydrate(component(), container);

      expect(el.querySelectorAll('span').length).toBe(1);
      expect(el.querySelector('span')).toBe(ssrSpan);

      msg = "now visible";
      update();
      expect(el.textContent).toContain('now visible');
    });
  });

  // =========================================================================
  // Text content mismatches — client wins
  // =========================================================================
  describe("text mismatch patching", () => {
    it("static text mismatch is patched to the client value", () => {
      injectSsr('<div><!-- text-0 -->server</div>');

      const el = hydrate(div("client"), container);

      expect(el.textContent).toBe('client');
    });

    it("reactive text mismatch is patched at hydration time, before any update()", () => {
      let count = 5; // server rendered 0, client state moved on
      injectSsr('<div><!-- text-0 -->0</div>');

      const el = hydrate(div(() => `${count}`), container);

      expect(el.textContent).toBe('5');

      count = 6;
      update();
      expect(el.textContent).toBe('6');
    });
  });

  // =========================================================================
  // when() — server branch differs from client branch
  // =========================================================================
  describe("when() branch mismatch", () => {
    it("renders the client branch when the server rendered the other one", () => {
      // Server rendered with loggedIn=true
      const serverHtml = (() => {
        const loggedIn = true;
        return renderToString(div(when(() => loggedIn, span("welcome")).else(p("login"))));
      })();
      injectSsr(serverHtml);
      expect(container.textContent).toContain('welcome');

      // Client evaluates loggedIn=false
      let loggedIn = false;
      const el = hydrate(
        div(when(() => loggedIn, span("welcome")).else(p("login"))),
        container
      );

      expect(el.textContent).toBe('login');
      expect(el.querySelectorAll('span').length).toBe(0);
      expect(el.querySelectorAll('p').length).toBe(1);

      // And the runtime still reacts to later changes
      loggedIn = true;
      update();
      expect(el.textContent).toBe('welcome');
    });

    it("matching branch reuses SSR nodes (no re-render)", () => {
      const loggedIn = true;
      injectSsr(renderToString(div(when(() => loggedIn, span("welcome")).else(p("login")))));

      const ssrSpan = container.querySelector('span')!;
      const el = hydrate(
        div(when(() => loggedIn, span("welcome")).else(p("login"))),
        container
      );

      expect(el.querySelector('span')).toBe(ssrSpan);
    });

    it("server rendered nothing (no match, no else), client has a match", () => {
      const serverHtml = (() => {
        const show = false;
        return renderToString(div(when(() => show, span("content"))));
      })();
      injectSsr(serverHtml);

      const show = true;
      const el = hydrate(div(when(() => show, span("content"))), container);

      expect(el.textContent).toBe('content');
      expect(el.querySelectorAll('span').length).toBe(1);
    });

    it("server rendered a branch, client has no match and no else", () => {
      const serverHtml = (() => {
        const show = true;
        return renderToString(div(when(() => show, span("content"))));
      })();
      injectSsr(serverHtml);

      let show = false;
      const el = hydrate(div(when(() => show, span("content"))), container);

      expect(el.textContent).toBe('');
      expect(el.querySelectorAll('span').length).toBe(0);

      show = true;
      update();
      expect(el.textContent).toBe('content');
    });
  });

  // =========================================================================
  // list() — item count changed between server render and hydration
  // =========================================================================
  describe("list() count mismatch", () => {
    function listComponent(items: () => string[]) {
      return div(list(items, (item) => span(item)));
    }

    it("removes leftover server items when the client has fewer", () => {
      const serverHtml = (() => {
        const items = () => ["a", "b", "c"];
        return renderToString(listComponent(items));
      })();
      injectSsr(serverHtml);
      expect(container.querySelectorAll('span').length).toBe(3);

      const clientItems = ["a", "b"];
      const el = hydrate(listComponent(() => clientItems), container);

      expect(el.querySelectorAll('span').length).toBe(2);
      expect(el.textContent).toBe('ab');

      // Still reactive afterwards
      clientItems.push("d");
      update();
      expect(el.textContent).toBe('abd');
    });

    it("inserts missing items when the client has more", () => {
      const serverHtml = (() => {
        const items = () => ["a", "b"];
        return renderToString(listComponent(items));
      })();
      injectSsr(serverHtml);

      const clientItems = ["a", "b", "c", "d"];
      const el = hydrate(listComponent(() => clientItems), container);

      expect(el.querySelectorAll('span').length).toBe(4);
      expect(el.textContent).toBe('abcd');

      // Inserted items must be inside the marker range: removing via the
      // runtime must still work.
      clientItems.length = 0;
      update();
      expect(el.querySelectorAll('span').length).toBe(0);
    });

    it("patches item content when values changed but count is equal", () => {
      const serverHtml = (() => {
        const items = () => ["old1", "old2"];
        return renderToString(listComponent(items));
      })();
      injectSsr(serverHtml);

      const clientItems = ["new1", "new2"];
      const el = hydrate(listComponent(() => clientItems), container);

      expect(el.textContent).toBe('new1new2');
    });

    it("server list empty, client has items", () => {
      const serverHtml = (() => {
        const items = (): string[] => [];
        return renderToString(listComponent(items));
      })();
      injectSsr(serverHtml);

      const clientItems = ["a", "b"];
      const el = hydrate(listComponent(() => clientItems), container);

      expect(el.querySelectorAll('span').length).toBe(2);
      expect(el.textContent).toBe('ab');
    });
  });

  // =========================================================================
  // Independent roots — islands pattern (one container per component)
  // =========================================================================
  describe("independent hydration roots", () => {
    it("two components hydrate into separate containers independently", () => {
      const containerB = document.createElement('div');
      document.body.appendChild(containerB);
      injectSsr(renderToString(div("first")));
      containerB.innerHTML = renderToString(div("second"));

      const first = hydrate(div("first"), container);
      const second = hydrate(div("second"), containerB);

      expect(first).not.toBe(second);
      expect(first.parentNode).toBe(container);
      expect(second.parentNode).toBe(containerB);
      expect(container.textContent).toBe('first');
      expect(containerB.textContent).toBe('second');
    });

    it("re-hydrating a container after its content was replaced starts fresh", () => {
      injectSsr(renderToString(div(span("one"))));
      hydrate(div(span("one")), container);

      container.innerHTML = renderToString(div(p("two")));
      const el = hydrate(div(p("two")), container);

      expect(el.parentNode).toBe(container);
      expect(container.children.length).toBe(1);
      expect(container.textContent).toBe('two');
    });
  });
});
