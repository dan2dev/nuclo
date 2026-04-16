/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderToString } from "../../src/ssr/renderToString";
import { render } from "../../src/utility/render";
import { update } from "../../src/core/updateController";
import "../../src/index";

/**
 * SSR Hydration Tests
 *
 * These tests simulate the full SSR → client hydration lifecycle:
 *
 *   1.  A server (Node.js) produces an HTML string via renderToString().
 *       The clean server output is represented here as a hardcoded string,
 *       because running renderToString() inside jsdom produces slightly different
 *       markup (jsdom expands DocumentFragment children inline, causing reactive
 *       anchor comments like <!-- text-0 --> to appear as element children rather
 *       than being skipped by the SSR serializer as they would be in Node).
 *
 *   2.  The browser receives the server HTML and injects it into the DOM.
 *
 *   3.  The Nuclo client runtime mounts the same component via render(),
 *       wiring up reactive text nodes, event listeners, and conditional branches.
 *
 *   4.  Assertions confirm that the live component is fully interactive after
 *       hydration.
 *
 * Note: render() appends a new live component to the container alongside the
 * static SSR HTML.  All DOM queries for live elements use the element returned
 * by render() to avoid accidentally matching the static copy.
 */
describe("SSR Hydration", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    container.id = "app";
    document.body.appendChild(container);
  });

  /** Injects the server-produced HTML into the container (simulates what a browser does). */
  function injectSsrHtml(html: string): void {
    container.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // 1. Server HTML is consistent with what renderToString() produces
  //    (verified in jsdom: visible content matches, structure is correct)
  // ---------------------------------------------------------------------------
  describe("renderToString output is consistent in jsdom environment", () => {
    it("contains the correct text for a static component", () => {
      const html = renderToString(div({ id: "hello" }, "Hello, SSR!"));
      // In jsdom, comment anchor markers may be present; the visible text must be correct
      expect(html).toContain('id="hello"');
      expect(html).toContain("Hello, SSR!");
      expect(html).toContain("<div");
      expect(html).toContain("</div>");
    });

    it("contains correct text for nested elements", () => {
      const html = renderToString(
        article(h2("Article Title"), p("First paragraph.")),
      );
      expect(html).toContain("Article Title");
      expect(html).toContain("First paragraph.");
      expect(html).toContain("<article");
      expect(html).toContain("<h2");
      expect(html).toContain("<p");
    });

    it("does not include event handler attributes", () => {
      const html = renderToString(
        button(
          "Click me",
          on("click", () => {}),
        ),
      );
      expect(html).toContain("Click me");
      expect(html).not.toContain("onclick");
    });

    it("serializes element attributes correctly", () => {
      const html = renderToString(
        div({ id: "root", class: "container", "data-env": "server" }, "Body"),
      );
      expect(html).toContain('id="root"');
      expect(html).toContain('class="container"');
      expect(html).toContain('data-env="server"');
    });

    it("renders reactive text with its initial evaluated value", () => {
      let count = 99;
      const html = renderToString(span(() => `Value: ${count}`));
      expect(html).toContain("Value: 99");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Hydration: client render() mounts a live interactive component
  //    (uses hardcoded server HTML that reflects the clean Node.js SSR output)
  // ---------------------------------------------------------------------------
  describe("live component is reactive after hydration", () => {
    it("reactive text node updates when state changes", () => {
      let count = 0;
      const component = div(h1(() => `Count: ${count}`));

      // Inject the clean server HTML (as a Node.js SSR server would have sent it)
      injectSsrHtml("<div><h1>Count: 0</h1></div>");

      // Hydrate: mount the live component (appended after the static SSR HTML)
      const liveDiv = render(component, container);

      // Access the live reactive h1 via the returned root element
      const heading = liveDiv.querySelector("h1");
      expect(heading?.textContent).toBe("Count: 0");

      count = 7;
      update();

      expect(heading?.textContent).toBe("Count: 7");
    });

    it("multiple state updates keep the DOM in sync", () => {
      let label = "start";
      const component = p(() => label);

      injectSsrHtml("<p>start</p>");
      const liveP = render(component, container);

      expect(liveP.textContent).toBe("start");

      label = "middle";
      update();
      expect(liveP.textContent).toBe("middle");

      label = "end";
      update();
      expect(liveP.textContent).toBe("end");
    });

    it("reactive attribute resolver runs after hydration", () => {
      let active = false;
      const component = div(
        { class: () => (active ? "box active" : "box") },
        "Item",
      );

      injectSsrHtml('<div class="box">Item</div>');
      const liveDiv = render(component, container);

      expect(liveDiv.className).toBe("box");

      active = true;
      update();

      expect(liveDiv.className).toBe("box active");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Event handlers are correctly wired after hydration
  // ---------------------------------------------------------------------------
  describe("event handlers work after hydration", () => {
    it("click handler fires on the live element", () => {
      let fired = false;
      const component = button(
        "Press",
        on("click", () => {
          fired = true;
        }),
      );

      // Static server HTML has no event binding
      injectSsrHtml("<button>Press</button>");
      const liveBtn = render(component, container) as HTMLButtonElement;

      expect(fired).toBe(false);
      liveBtn.click();
      expect(fired).toBe(true);
    });

    it("counter increments correctly via click", () => {
      let count = 0;
      const component = div(
        span(() => String(count)),
        button(
          "Inc",
          on("click", () => {
            count++;
            update();
          }),
        ),
      );

      injectSsrHtml("<div><span>0</span><button>Inc</button></div>");
      const liveDiv = render(component, container);

      const liveSpan = liveDiv.querySelector("span");
      const liveBtn = liveDiv.querySelector("button") as HTMLButtonElement;

      expect(liveSpan?.textContent).toBe("0");

      liveBtn.click();
      expect(liveSpan?.textContent).toBe("1");

      liveBtn.click();
      expect(liveSpan?.textContent).toBe("2");
    });

    it("multiple event types are each wired independently", () => {
      const log: string[] = [];
      const component = div(
        on("click", () => log.push("click")),
        on("mouseenter", () => log.push("enter")),
      );

      injectSsrHtml("<div></div>");
      const liveDiv = render(component, container);

      liveDiv.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      liveDiv.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      liveDiv.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(log).toEqual(["click", "enter", "click"]);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Conditional rendering (when) is live after hydration
  // ---------------------------------------------------------------------------
  describe("conditional rendering after hydration", () => {
    it("when() branch switches on state change", () => {
      let show = true;
      const component = div(when(() => show, p("Shown")).else(p("Hidden")));

      injectSsrHtml("<div><p>Shown</p></div>");
      const liveDiv = render(component, container);

      expect(liveDiv.textContent).toContain("Shown");

      show = false;
      update();

      expect(liveDiv.textContent).toContain("Hidden");
      expect(liveDiv.textContent).not.toContain("Shown");
    });

    it("when() can switch back and forth", () => {
      let toggle = false;
      const component = span(when(() => toggle, "ON").else("OFF"));

      injectSsrHtml("<span>OFF</span>");
      const liveSpan = render(component, container);

      expect(liveSpan.textContent).toContain("OFF");

      toggle = true;
      update();
      expect(liveSpan.textContent).toContain("ON");

      toggle = false;
      update();
      expect(liveSpan.textContent).toContain("OFF");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. List rendering after hydration
  // ---------------------------------------------------------------------------
  describe("list rendering after hydration", () => {
    it("list() is reactive after mounting on SSR container", () => {
      let items = ["Alpha", "Beta", "Gamma"];
      const component = ul(
        list(
          () => items,
          (item) => li(item),
        ),
      );

      injectSsrHtml("<ul><li>Alpha</li><li>Beta</li><li>Gamma</li></ul>");
      const liveUl = render(component, container);

      expect(liveUl.querySelectorAll("li").length).toBe(3);

      items = ["Alpha", "Beta", "Gamma", "Delta"];
      update();

      expect(liveUl.querySelectorAll("li").length).toBe(4);
    });

    it("list() reflects item removal after state change", () => {
      let items = ["X", "Y", "Z"];
      const component = ul(
        list(
          () => items,
          (item) => li(item),
        ),
      );

      injectSsrHtml("<ul><li>X</li><li>Y</li><li>Z</li></ul>");
      const liveUl = render(component, container);

      expect(liveUl.querySelectorAll("li").length).toBe(3);

      items = ["X"];
      update();

      expect(liveUl.querySelectorAll("li").length).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Multiple independent components can each be hydrated separately
  // ---------------------------------------------------------------------------
  describe("multiple components hydrated independently", () => {
    it("two live components with separate state do not interfere", () => {
      const container2 = document.createElement("div");
      document.body.appendChild(container2);

      let stateA = "A";
      let stateB = "B";

      const compA = div({ id: "comp-a" }, () => stateA);
      const compB = div({ id: "comp-b" }, () => stateB);

      const liveA = render(compA, container);
      const liveB = render(compB, container2);

      expect(liveA.textContent).toBe("A");
      expect(liveB.textContent).toBe("B");

      stateA = "A2";
      update();

      expect(liveA.textContent).toBe("A2");
      expect(liveB.textContent).toBe("B"); // unaffected
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Full SSR round-trip: server HTML is semantically equivalent to client render
  // ---------------------------------------------------------------------------
  describe("SSR round-trip semantic equivalence", () => {
    it("visible text content from renderToString matches what render() produces", () => {
      const component = div(h1("Page Title"), p("Static content"));

      // Get what the server would produce (text content is always correct)
      const ssrHtml = renderToString(component);
      const parser = new DOMParser();
      const ssrDoc = parser.parseFromString(
        `<body>${ssrHtml}</body>`,
        "text/html",
      );
      const ssrText = ssrDoc.body.textContent ?? "";

      // Mount the live component
      const liveEl = render(component, container);
      const liveText = liveEl.textContent ?? "";

      // Both should produce the same visible text
      expect(liveText.trim()).toBe(ssrText.trim());
    });

    it("attribute values are identical between SSR and live render", () => {
      const component = article({ id: "post-1", class: "post featured" });

      const ssrHtml = renderToString(component);
      expect(ssrHtml).toContain('id="post-1"');
      expect(ssrHtml).toContain('class="post featured"');

      const liveEl = render(component, container);
      expect(liveEl.id).toBe("post-1");
      expect(liveEl.className).toBe("post featured");
    });
  });
});
