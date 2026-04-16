/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { hydrate, render } from "../../src/utility/render";
import { update } from "../../src/core/updateController";
import "../../src/index";

/**
 * True hydration tests — verify that hydrate() reuses existing SSR DOM nodes
 * instead of creating new ones.
 *
 * Key difference from the existing "hydration" tests:
 *   - render() creates NEW elements and appends them alongside the SSR HTML
 *   - hydrate() claims EXISTING elements from the SSR HTML and attaches reactivity
 *
 * Each test injects SSR HTML, calls hydrate(), and verifies:
 *   1. The returned element IS the same DOM node that was in the container
 *   2. No new elements were appended (childNodes count unchanged)
 *   3. Reactivity works correctly after hydration
 */
describe("hydrate() — true DOM reuse", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    container.id = "app";
    document.body.appendChild(container);
  });

  function injectSsr(html: string): void {
    container.innerHTML = html;
  }

  // =========================================================================
  // Basic element reuse
  // =========================================================================
  describe("element reuse", () => {
    it("reuses the existing root element", () => {
      injectSsr('<div id="root">Hello</div>');
      const existingDiv = container.firstElementChild!;

      const hydratedDiv = hydrate(div({ id: "root" }, "Hello"), container);

      // Same DOM node — not a new element
      expect(hydratedDiv).toBe(existingDiv);
      // Only one child in container (the existing div, not a new one)
      expect(container.children.length).toBe(1);
    });

    it("reuses nested elements", () => {
      injectSsr("<section><h1>Title</h1><p>Content</p></section>");
      const existingSection = container.firstElementChild!;
      const existingH1 = existingSection.querySelector("h1")!;
      const existingP = existingSection.querySelector("p")!;

      const hydratedSection = hydrate(
        section(h1("Title"), p("Content")),
        container,
      );

      expect(hydratedSection).toBe(existingSection);
      expect(hydratedSection.querySelector("h1")).toBe(existingH1);
      expect(hydratedSection.querySelector("p")).toBe(existingP);
      expect(container.children.length).toBe(1);
    });

    it("preserves attributes from SSR", () => {
      injectSsr(
        '<div id="root" class="container" data-env="server">Body</div>',
      );
      const existingDiv = container.firstElementChild!;

      const hydratedDiv = hydrate(
        div({ id: "root", class: "container", "data-env": "server" }, "Body"),
        container,
      );

      expect(hydratedDiv).toBe(existingDiv);
      expect(hydratedDiv.id).toBe("root");
      expect(hydratedDiv.className).toBe("container");
      expect(hydratedDiv.getAttribute("data-env")).toBe("server");
    });
  });

  // =========================================================================
  // Reactive text hydration
  // =========================================================================
  describe("reactive text", () => {
    it("reactive text updates after hydration on existing element", () => {
      let count = 0;
      injectSsr("<div><h1><!-- text-0 -->Count: 0</h1></div>");
      const existingDiv = container.firstElementChild!;
      const existingH1 = existingDiv.querySelector("h1")!;

      const hydratedDiv = hydrate(div(h1(() => `Count: ${count}`)), container);

      expect(hydratedDiv).toBe(existingDiv);
      expect(hydratedDiv.querySelector("h1")).toBe(existingH1);
      expect(existingH1.textContent).toContain("Count: 0");

      count = 7;
      update();
      expect(existingH1.textContent).toContain("Count: 7");
    });

    it("multiple reactive text nodes update correctly", () => {
      let title = "Old";
      let subtitle = "Sub";

      injectSsr(
        "<div><h1><!-- text-0 -->Old</h1><h2><!-- text-0 -->Sub</h2></div>",
      );
      const existingDiv = container.firstElementChild!;

      const hydratedDiv = hydrate(
        div(
          h1(() => title),
          h2(() => subtitle),
        ),
        container,
      );

      expect(hydratedDiv).toBe(existingDiv);

      title = "New";
      subtitle = "Updated";
      update();

      expect(hydratedDiv.querySelector("h1")!.textContent).toContain("New");
      expect(hydratedDiv.querySelector("h2")!.textContent).toContain("Updated");
    });
  });

  // =========================================================================
  // Reactive attributes hydration
  // =========================================================================
  describe("reactive attributes", () => {
    it("reactive className updates after hydration", () => {
      let active = false;
      injectSsr('<div class="box">Item</div>');
      const existingDiv = container.firstElementChild!;

      const hydratedDiv = hydrate(
        div({ class: () => (active ? "box active" : "box") }, "Item"),
        container,
      );

      expect(hydratedDiv).toBe(existingDiv);
      expect(hydratedDiv.className).toBe("box");

      active = true;
      update();
      expect(hydratedDiv.className).toBe("box active");
    });

    it("reactive disabled toggles after hydration", () => {
      let locked = false;
      injectSsr("<button><!-- text-0 -->Submit</button>");

      const hydratedBtn = hydrate(
        button({ disabled: () => locked }, "Submit"),
        container,
      ) as HTMLButtonElement;

      expect(hydratedBtn.disabled).toBe(false);

      locked = true;
      update();
      expect(hydratedBtn.disabled).toBe(true);
    });
  });

  // =========================================================================
  // Event listeners
  // =========================================================================
  describe("event listeners", () => {
    it("click handler fires on hydrated element", () => {
      let fired = false;
      injectSsr("<button><!-- text-0 -->Press</button>");
      const existingBtn = container.firstElementChild!;

      const hydratedBtn = hydrate(
        button(
          "Press",
          on("click", () => {
            fired = true;
          }),
        ),
        container,
      ) as HTMLButtonElement;

      expect(hydratedBtn).toBe(existingBtn);
      expect(fired).toBe(false);
      hydratedBtn.click();
      expect(fired).toBe(true);
    });

    it("counter increments via click on hydrated elements", () => {
      let count = 0;
      injectSsr(
        "<div><span><!-- text-0 -->0</span><button><!-- text-0 -->Inc</button></div>",
      );
      const existingDiv = container.firstElementChild!;

      const hydratedDiv = hydrate(
        div(
          span(() => String(count)),
          button(
            "Inc",
            on("click", () => {
              count++;
              update();
            }),
          ),
        ),
        container,
      );

      expect(hydratedDiv).toBe(existingDiv);

      const liveSpan = hydratedDiv.querySelector("span")!;
      const liveBtn = hydratedDiv.querySelector("button") as HTMLButtonElement;

      expect(liveSpan.textContent).toContain("0");
      liveBtn.click();
      expect(liveSpan.textContent).toContain("1");
      liveBtn.click();
      expect(liveSpan.textContent).toContain("2");
    });
  });

  // =========================================================================
  // when() hydration
  // =========================================================================
  describe("when() — conditional rendering", () => {
    it("reuses existing elements and switches branches", () => {
      let show = true;
      injectSsr(
        "<div><!--when-start-0--><p><!-- text-0 -->Shown</p><!--when-end--></div>",
      );
      const existingDiv = container.firstElementChild!;

      const hydratedDiv = hydrate(
        div(when(() => show, p("Shown")).else(p("Hidden"))),
        container,
      );

      expect(hydratedDiv).toBe(existingDiv);
      expect(hydratedDiv.textContent).toContain("Shown");

      show = false;
      update();
      expect(hydratedDiv.textContent).toContain("Hidden");
      expect(hydratedDiv.textContent).not.toContain("Shown");
    });

    it("toggles back and forth after hydration", () => {
      let toggle = false;
      injectSsr(
        "<span><!--when-start-0--><span><!-- text-0 -->OFF</span><!--when-end--></span>",
      );

      const hydratedSpan = hydrate(
        span(when(() => toggle, span("ON")).else(span("OFF"))),
        container,
      );

      expect(hydratedSpan.textContent).toContain("OFF");

      toggle = true;
      update();
      expect(hydratedSpan.textContent).toContain("ON");

      toggle = false;
      update();
      expect(hydratedSpan.textContent).toContain("OFF");
    });

    it("multi-branch when() routes correctly after hydration", () => {
      let status: "loading" | "error" | "ready" = "loading";
      injectSsr(
        "<div><!--when-start-0--><span><!-- text-0 -->Loading…</span><!--when-end--></div>",
      );

      const hydratedDiv = hydrate(
        div(
          when(() => status === "loading", span("Loading…"))
            .when(() => status === "error", span("Error!"))
            .else(span("Ready")),
        ),
        container,
      );

      expect(hydratedDiv.textContent).toContain("Loading…");

      status = "error";
      update();
      expect(hydratedDiv.textContent).toContain("Error!");

      status = "ready";
      update();
      expect(hydratedDiv.textContent).toContain("Ready");
    });

    it("when() with reactive text inside branch", () => {
      let visible = true;
      let label = "hello";
      injectSsr(
        "<div><!--when-start-0--><span><!-- text-0 -->hello</span><!--when-end--></div>",
      );

      const hydratedDiv = hydrate(
        div(
          when(
            () => visible,
            span(() => label),
          ).else(span("hidden")),
        ),
        container,
      );

      expect(hydratedDiv.textContent).toContain("hello");

      label = "world";
      update();
      expect(hydratedDiv.textContent).toContain("world");

      visible = false;
      update();
      expect(hydratedDiv.textContent).toContain("hidden");
    });
  });

  // =========================================================================
  // list() hydration
  // =========================================================================
  describe("list() — reactive lists", () => {
    it("reuses existing list items and supports additions", () => {
      let items = ["Apple", "Banana", "Cherry"];
      injectSsr(
        "<ul><!--list-start-0-->" +
          "<li><!-- text-0 -->Apple</li>" +
          "<li><!-- text-0 -->Banana</li>" +
          "<li><!-- text-0 -->Cherry</li>" +
          "<!--list-end--></ul>",
      );
      const existingUl = container.firstElementChild!;
      const existingLis = Array.from(existingUl.querySelectorAll("li"));

      const hydratedUl = hydrate(
        ul(
          list(
            () => items,
            (item) => li(item),
          ),
        ),
        container,
      );

      expect(hydratedUl).toBe(existingUl);
      // Existing li elements are reused
      const hydratedLis = Array.from(hydratedUl.querySelectorAll("li"));
      expect(hydratedLis[0]).toBe(existingLis[0]);
      expect(hydratedLis[1]).toBe(existingLis[1]);
      expect(hydratedLis[2]).toBe(existingLis[2]);

      // Add a new item
      items = ["Apple", "Banana", "Cherry", "Date"];
      update();
      expect(hydratedUl.querySelectorAll("li").length).toBe(4);
    });

    it("supports item removal after hydration", () => {
      let items = ["X", "Y", "Z"];
      injectSsr(
        "<ul><!--list-start-0-->" +
          "<li><!-- text-0 -->X</li>" +
          "<li><!-- text-0 -->Y</li>" +
          "<li><!-- text-0 -->Z</li>" +
          "<!--list-end--></ul>",
      );

      const hydratedUl = hydrate(
        ul(
          list(
            () => items,
            (item) => li(item),
          ),
        ),
        container,
      );

      items = ["X"];
      update();
      expect(hydratedUl.querySelectorAll("li").length).toBe(1);
      expect(hydratedUl.querySelector("li")!.textContent).toContain("X");
    });

    it("list with reactive text in items updates correctly", () => {
      const item = { id: 1, count: 0 };
      let items = [item];
      injectSsr(
        "<ul><!--list-start-0-->" +
          '<li data-id="1"><!-- text-0 -->Count: 0</li>' +
          "<!--list-end--></ul>",
      );

      const hydratedUl = hydrate(
        ul(
          list(
            () => items,
            (it) =>
              li({ "data-id": String(it.id) }, () => `Count: ${it.count}`),
          ),
        ),
        container,
      );

      expect(hydratedUl.querySelector('[data-id="1"]')!.textContent).toContain(
        "Count: 0",
      );

      item.count = 5;
      update();
      expect(hydratedUl.querySelector('[data-id="1"]')!.textContent).toContain(
        "Count: 5",
      );
    });

    it("empty list hydration then populate", () => {
      let items: string[] = [];
      injectSsr("<ul><!--list-start-0--><!--list-end--></ul>");

      const hydratedUl = hydrate(
        ul(
          list(
            () => items,
            (item) => li(item),
          ),
        ),
        container,
      );

      expect(hydratedUl.querySelectorAll("li").length).toBe(0);

      items = ["A", "B"];
      update();
      expect(hydratedUl.querySelectorAll("li").length).toBe(2);
    });
  });

  // =========================================================================
  // Combined scenarios
  // =========================================================================
  describe("combined scenarios", () => {
    it("when() inside list() items", () => {
      interface Product {
        id: number;
        name: string;
        inStock: boolean;
      }
      let products: Product[] = [
        { id: 1, name: "Widget", inStock: true },
        { id: 2, name: "Gadget", inStock: false },
      ];

      injectSsr(
        "<ul><!--list-start-0-->" +
          '<li data-id="1"><span><!-- text-0 -->Widget</span><!--when-start-1--><span><!-- text-0 --> [in stock]</span><!--when-end--></li>' +
          '<li data-id="2"><span><!-- text-0 -->Gadget</span><!--when-start-1--><span><!-- text-0 --> [out of stock]</span><!--when-end--></li>' +
          "<!--list-end--></ul>",
      );

      const hydratedUl = hydrate(
        ul(
          list(
            () => products,
            (p) =>
              li(
                { "data-id": String(p.id) },
                span(p.name),
                when(() => p.inStock, span(" [in stock]")).else(
                  span(" [out of stock]"),
                ),
              ),
          ),
        ),
        container,
      );

      expect(hydratedUl.querySelector('[data-id="1"]')!.textContent).toContain(
        "in stock",
      );
      expect(hydratedUl.querySelector('[data-id="2"]')!.textContent).toContain(
        "out of stock",
      );

      products[1].inStock = true;
      update();
      expect(hydratedUl.querySelector('[data-id="2"]')!.textContent).toContain(
        "in stock",
      );
    });

    it("list() inside when() branch", () => {
      let show = true;
      let items = ["one", "two"];

      injectSsr(
        "<div><!--when-start-0-->" +
          "<ul><!--list-start-0-->" +
          "<li><!-- text-0 -->one</li>" +
          "<li><!-- text-0 -->two</li>" +
          "<!--list-end--></ul>" +
          "<!--when-end--></div>",
      );

      const hydratedDiv = hydrate(
        div(
          when(
            () => show,
            ul(
              list(
                () => items,
                (item) => li(item),
              ),
            ),
          ).else(p("hidden")),
        ),
        container,
      );

      expect(hydratedDiv.querySelectorAll("li").length).toBe(2);

      items = ["one", "two", "three"];
      update();
      expect(hydratedDiv.querySelectorAll("li").length).toBe(3);

      show = false;
      update();
      expect(hydratedDiv.querySelectorAll("li").length).toBe(0);
      expect(hydratedDiv.textContent).toContain("hidden");
    });

    it("static siblings around when() preserved", () => {
      let show = true;
      injectSsr(
        "<div>" +
          "<p><!-- text-0 -->before</p>" +
          "<!--when-start-1--><span><!-- text-0 -->inside</span><!--when-end-->" +
          "<p><!-- text-0 -->after</p>" +
          "</div>",
      );
      const existingDiv = container.firstElementChild!;
      const existingPs = existingDiv.querySelectorAll("p");

      const hydratedDiv = hydrate(
        div(
          p("before"),
          when(() => show, span("inside")).else(span("else")),
          p("after"),
        ),
        container,
      );

      expect(hydratedDiv).toBe(existingDiv);
      // Static p elements are the same DOM nodes
      expect(hydratedDiv.querySelectorAll("p")[0]).toBe(existingPs[0]);
      expect(hydratedDiv.querySelectorAll("p")[1]).toBe(existingPs[1]);

      show = false;
      update();
      expect(hydratedDiv.textContent).toContain("else");
      expect(hydratedDiv.textContent).toContain("before");
      expect(hydratedDiv.textContent).toContain("after");
    });

    it("complex app — todo list with hydration", () => {
      interface Todo {
        id: number;
        text: string;
        done: boolean;
      }
      let todos: Todo[] = [
        { id: 1, text: "Buy milk", done: false },
        { id: 2, text: "Walk dog", done: true },
      ];

      injectSsr(
        "<div>" +
          "<p><!-- text-0 -->1 remaining</p>" +
          "<ul><!--list-start-0-->" +
          '<li data-id="1" class="pending"><span><!-- text-0 -->Buy milk</span>' +
          "<button><!-- text-0 -->toggle</button></li>" +
          '<li data-id="2" class="done"><span><!-- text-0 -->Walk dog</span>' +
          "<button><!-- text-0 -->toggle</button></li>" +
          "<!--list-end--></ul>" +
          "</div>",
      );
      const existingDiv = container.firstElementChild!;

      const hydratedDiv = hydrate(
        div(
          p(() => `${todos.filter((t) => !t.done).length} remaining`),
          ul(
            list(
              () => todos,
              (todo) =>
                li(
                  {
                    "data-id": String(todo.id),
                    class: () => (todo.done ? "done" : "pending"),
                  },
                  span(() => todo.text),
                  button(
                    "toggle",
                    on("click", () => {
                      todo.done = !todo.done;
                      update();
                    }),
                  ),
                ),
            ),
          ),
        ),
        container,
      );

      expect(hydratedDiv).toBe(existingDiv);
      expect(hydratedDiv.querySelector("p")!.textContent).toContain(
        "1 remaining",
      );

      // Toggle todo #1
      const toggleBtn1 = hydratedDiv.querySelector(
        '[data-id="1"] button',
      ) as HTMLButtonElement;
      toggleBtn1.click();
      expect(hydratedDiv.querySelector('[data-id="1"]')!.className).toBe(
        "done",
      );
      expect(hydratedDiv.querySelector("p")!.textContent).toContain(
        "0 remaining",
      );

      // Toggle back
      toggleBtn1.click();
      expect(hydratedDiv.querySelector('[data-id="1"]')!.className).toBe(
        "pending",
      );
      expect(hydratedDiv.querySelector("p")!.textContent).toContain(
        "1 remaining",
      );
    });
  });

  // =========================================================================
  // Container has only SSR content after hydration (no duplicates)
  // =========================================================================
  describe("no duplicate DOM nodes", () => {
    it("container has exactly one child after hydrating a single root", () => {
      injectSsr("<div><h1><!-- text-0 -->Hello</h1></div>");

      hydrate(div(h1("Hello")), container);

      expect(container.children.length).toBe(1);
      expect(container.firstElementChild!.tagName).toBe("DIV");
    });

    it("deeply nested tree has no duplicate elements", () => {
      injectSsr(
        '<main><header><nav><a href="/"><!-- text-0 -->Home</a></nav></header></main>',
      );
      const existingMain = container.firstElementChild!;

      const hydratedMain = hydrate(
        main(header(nav(a({ href: "/" }, "Home")))),
        container,
      );

      expect(hydratedMain).toBe(existingMain);
      expect(container.querySelectorAll("main").length).toBe(1);
      expect(container.querySelectorAll("header").length).toBe(1);
      expect(container.querySelectorAll("nav").length).toBe(1);
      expect(container.querySelectorAll("a").length).toBe(1);
    });
  });

  // =========================================================================
  // scope() with hydration
  // =========================================================================
  describe("scope() — targeted updates after hydration", () => {
    it("scoped update only refreshes the targeted subtree", () => {
      let counterA = 0;
      let counterB = 0;

      injectSsr(
        "<div>" +
          "<div><span><!-- text-0 -->A=0</span></div>" +
          "<div><span><!-- text-0 -->B=0</span></div>" +
          "</div>",
      );

      const hydratedDiv = hydrate(
        div(
          div(
            scope("panel-a"),
            span(() => `A=${counterA}`),
          ),
          div(
            scope("panel-b"),
            span(() => `B=${counterB}`),
          ),
        ),
        container,
      );

      const panels = hydratedDiv.querySelectorAll("div");
      const spanA = panels[0].querySelector("span")!;
      const spanB = panels[1].querySelector("span")!;

      counterA = 1;
      update("panel-a");
      expect(spanA.textContent).toContain("A=1");
      expect(spanB.textContent).toContain("B=0"); // unchanged

      counterB = 9;
      update("panel-b");
      expect(spanB.textContent).toContain("B=9");
    });
  });

  // =========================================================================
  // Mismatch handling — graceful degradation
  // =========================================================================
  describe("mismatch handling — graceful degradation", () => {
    it("creates new element when SSR tag doesn't match component tag", () => {
      // SSR has <span>, component expects <div>
      injectSsr("<span>Hello</span>");

      const hydratedDiv = hydrate(div("Hello"), container);

      // claimElement checks tagName — mismatch means it creates a new div
      expect(hydratedDiv.tagName).toBe("DIV");
      expect(hydratedDiv.textContent).toContain("Hello");
    });

    it("works when container is empty (no SSR HTML)", () => {
      // No SSR HTML at all
      injectSsr("");

      const hydratedDiv = hydrate(div("Hello"), container);

      expect(hydratedDiv.tagName).toBe("DIV");
      expect(hydratedDiv.textContent).toContain("Hello");
    });

    it("handles extra SSR children that component doesn't expect", () => {
      // SSR has 3 children, component only produces 2
      injectSsr(
        "<div>" +
          "<p><!-- text-0 -->First</p>" +
          "<p><!-- text-0 -->Second</p>" +
          "<p><!-- text-0 -->Third</p>" +
          "</div>",
      );

      const hydratedDiv = hydrate(div(p("First"), p("Second")), container);

      // Extra child should be cleaned up
      expect(hydratedDiv.querySelectorAll("p").length).toBe(2);
    });

    it("handles fewer SSR children than component expects", () => {
      // SSR has 2 children, component produces 3
      injectSsr(
        "<div>" +
          "<p><!-- text-0 -->First</p>" +
          "<p><!-- text-0 -->Second</p>" +
          "</div>",
      );
      const existingP1 = container.querySelector("div")!.children[0];

      const hydratedDiv = hydrate(
        div(p("First"), p("Second"), p("Third")),
        container,
      );

      // The first two p's are reused from SSR, the third is created fresh
      expect(hydratedDiv.querySelectorAll("p").length).toBe(3);
      expect(hydratedDiv.querySelectorAll("p")[0]).toBe(existingP1);
      expect(hydratedDiv.querySelectorAll("p")[0].textContent).toContain(
        "First",
      );
      expect(hydratedDiv.querySelectorAll("p")[2].textContent).toContain(
        "Third",
      );
    });
  });

  // =========================================================================
  // SSR-to-client parity
  // =========================================================================
  describe("SSR-to-client parity", () => {
    it("hydrated DOM matches what render() would produce — simple element", () => {
      injectSsr("<div><!-- text-0 -->hello</div>");

      const hydratedDiv = hydrate(div("hello"), container);

      // Create a fresh render for comparison
      const freshContainer = document.createElement("div");
      document.body.appendChild(freshContainer);
      const renderedDiv = render(div("hello"), freshContainer);

      expect(hydratedDiv.tagName).toBe(renderedDiv.tagName);
      expect(hydratedDiv.textContent).toBe(renderedDiv.textContent);
    });

    it("hydrated DOM matches what render() would produce — nested elements", () => {
      injectSsr(
        "<section><h1><!-- text-0 -->Title</h1><p><!-- text-0 -->Body</p></section>",
      );

      const hydratedEl = hydrate(section(h1("Title"), p("Body")), container);

      const freshContainer = document.createElement("div");
      document.body.appendChild(freshContainer);
      const renderedEl = render(
        section(h1("Title"), p("Body")),
        freshContainer,
      );

      expect(hydratedEl.tagName).toBe(renderedEl.tagName);
      expect(hydratedEl.querySelector("h1")!.textContent).toBe(
        renderedEl.querySelector("h1")!.textContent,
      );
      expect(hydratedEl.querySelector("p")!.textContent).toBe(
        renderedEl.querySelector("p")!.textContent,
      );
    });

    it("hydrated DOM matches what render() would produce — when() conditional", () => {
      let show = true;
      injectSsr(
        "<div><!--when-start-0--><span><!-- text-0 -->Yes</span><!--when-end--></div>",
      );

      const hydratedEl = hydrate(
        div(when(() => show, span("Yes")).else(span("No"))),
        container,
      );

      show = true;
      const freshContainer = document.createElement("div");
      document.body.appendChild(freshContainer);
      const renderedEl = render(
        div(when(() => show, span("Yes")).else(span("No"))),
        freshContainer,
      );

      // Both should show "Yes"
      expect(hydratedEl.textContent).toContain("Yes");
      expect(renderedEl.textContent).toContain("Yes");
    });

    it("hydrated DOM matches what render() would produce — list()", () => {
      const items = ["A", "B"];
      injectSsr(
        "<ul><!--list-start-0-->" +
          "<li><!-- text-0 -->A</li>" +
          "<li><!-- text-0 -->B</li>" +
          "<!--list-end--></ul>",
      );

      const hydratedEl = hydrate(
        ul(
          list(
            () => items,
            (item) => li(item),
          ),
        ),
        container,
      );

      const freshContainer = document.createElement("div");
      document.body.appendChild(freshContainer);
      const renderedEl = render(
        ul(
          list(
            () => items,
            (item) => li(item),
          ),
        ),
        freshContainer,
      );

      expect(hydratedEl.querySelectorAll("li").length).toBe(
        renderedEl.querySelectorAll("li").length,
      );
      expect(hydratedEl.querySelectorAll("li")[0].textContent).toBe(
        renderedEl.querySelectorAll("li")[0].textContent,
      );
      expect(hydratedEl.querySelectorAll("li")[1].textContent).toBe(
        renderedEl.querySelectorAll("li")[1].textContent,
      );
    });

    it("hydrated DOM matches what render() would produce — reactive text", () => {
      let count = 0;
      injectSsr("<div><span><!-- text-0 -->Count: 0</span></div>");

      const hydratedEl = hydrate(div(span(() => `Count: ${count}`)), container);

      const freshContainer = document.createElement("div");
      document.body.appendChild(freshContainer);
      const renderedEl = render(
        div(span(() => `Count: ${count}`)),
        freshContainer,
      );

      expect(hydratedEl.querySelector("span")!.textContent).toBe(
        renderedEl.querySelector("span")!.textContent,
      );

      // After update, both should show the same value
      count = 5;
      update();
      expect(hydratedEl.querySelector("span")!.textContent).toContain(
        "Count: 5",
      );
      expect(renderedEl.querySelector("span")!.textContent).toContain(
        "Count: 5",
      );
    });

    it("hydrated DOM matches what render() would produce — reactive attributes", () => {
      let active = false;
      injectSsr('<div class="box"><!-- text-0 -->Item</div>');

      const hydratedEl = hydrate(
        div({ class: () => (active ? "box active" : "box") }, "Item"),
        container,
      );

      const freshContainer = document.createElement("div");
      document.body.appendChild(freshContainer);
      const renderedEl = render(
        div({ class: () => (active ? "box active" : "box") }, "Item"),
        freshContainer,
      );

      expect(hydratedEl.className).toBe(renderedEl.className);

      active = true;
      update();
      expect(hydratedEl.className).toBe("box active");
      expect(renderedEl.className).toBe("box active");
    });
  });

  // =========================================================================
  // when() edge cases
  // =========================================================================
  describe("when() edge cases", () => {
    it("when() with all conditions false and no else — empty", () => {
      let condA = false;
      let condB = false;
      injectSsr("<div><!--when-start-0--><!--when-end--></div>");

      const hydratedDiv = hydrate(
        div(when(() => condA, span("A")).when(() => condB, span("B"))),
        container,
      );

      // Nothing should be rendered
      expect(hydratedDiv.querySelector("span")).toBeNull();
    });

    it("when() with initially false condition that becomes true", () => {
      let show = false;
      injectSsr("<div><!--when-start-0--><!--when-end--></div>");

      const hydratedDiv = hydrate(
        div(when(() => show, span("Visible"))),
        container,
      );

      expect(hydratedDiv.querySelector("span")).toBeNull();

      show = true;
      update();
      expect(hydratedDiv.querySelector("span")).not.toBeNull();
      expect(hydratedDiv.textContent).toContain("Visible");
    });

    it("when() with nested when() inside branches", () => {
      let outer = true;
      let inner = true;

      injectSsr(
        "<div><!--when-start-0-->" +
          "<div><!--when-start-0--><span><!-- text-0 -->Inner</span><!--when-end--></div>" +
          "<!--when-end--></div>",
      );

      const hydratedDiv = hydrate(
        div(
          when(
            () => outer,
            div(when(() => inner, span("Inner")).else(span("InnerElse"))),
          ).else(span("Outer else")),
        ),
        container,
      );

      expect(hydratedDiv.textContent).toContain("Inner");

      inner = false;
      update();
      expect(hydratedDiv.textContent).toContain("InnerElse");

      outer = false;
      update();
      expect(hydratedDiv.textContent).toContain("Outer else");
      expect(hydratedDiv.textContent).not.toContain("Inner");
    });

    it("when() markers without content between them (empty branch)", () => {
      let show = false;
      // SSR rendered with show=false and no else, so no content between markers
      injectSsr("<div><!--when-start-0--><!--when-end--></div>");

      const hydratedDiv = hydrate(
        div(when(() => show, p("Content"))),
        container,
      );

      expect(hydratedDiv.querySelector("p")).toBeNull();

      show = true;
      update();
      expect(hydratedDiv.querySelector("p")).not.toBeNull();
      expect(hydratedDiv.textContent).toContain("Content");
    });
  });

  // =========================================================================
  // list() edge cases
  // =========================================================================
  describe("list() edge cases", () => {
    it("list with single item hydration", () => {
      const items = ["Only"];
      injectSsr(
        "<ul><!--list-start-0-->" +
          "<li><!-- text-0 -->Only</li>" +
          "<!--list-end--></ul>",
      );
      const existingLi = container.querySelector("li")!;

      const hydratedUl = hydrate(
        ul(
          list(
            () => items,
            (item) => li(item),
          ),
        ),
        container,
      );

      expect(hydratedUl.querySelectorAll("li").length).toBe(1);
      expect(hydratedUl.querySelector("li")).toBe(existingLi);
      expect(existingLi.textContent).toContain("Only");
    });

    it("list item reorder after hydration", () => {
      let items = [
        { id: 1, label: "A" },
        { id: 2, label: "B" },
        { id: 3, label: "C" },
      ];
      injectSsr(
        "<ul><!--list-start-0-->" +
          "<li><!-- text-0 -->A</li>" +
          "<li><!-- text-0 -->B</li>" +
          "<li><!-- text-0 -->C</li>" +
          "<!--list-end--></ul>",
      );

      const hydratedUl = hydrate(
        ul(
          list(
            () => items,
            (item) => li(() => item.label),
          ),
        ),
        container,
      );

      expect(hydratedUl.querySelectorAll("li").length).toBe(3);

      // Reverse order — same object references
      items = [items[2], items[1], items[0]];
      update();

      const lis = hydratedUl.querySelectorAll("li");
      expect(lis.length).toBe(3);
      expect(lis[0].textContent).toContain("C");
      expect(lis[1].textContent).toContain("B");
      expect(lis[2].textContent).toContain("A");
    });

    it("list items with object identity — mutate in place updates", () => {
      const items = [
        { id: 1, name: "Foo" },
        { id: 2, name: "Bar" },
      ];
      injectSsr(
        "<ul><!--list-start-0-->" +
          "<li><!-- text-0 -->Foo</li>" +
          "<li><!-- text-0 -->Bar</li>" +
          "<!--list-end--></ul>",
      );

      const hydratedUl = hydrate(
        ul(
          list(
            () => items,
            (item) => li(() => item.name),
          ),
        ),
        container,
      );

      const firstLi = hydratedUl.querySelector("li")!;

      // Mutate in place — same reference, element should be reused
      items[0].name = "Foo Updated";
      update();
      expect(hydratedUl.querySelector("li")).toBe(firstLi);
      expect(firstLi.textContent).toContain("Foo Updated");
    });

    it("nested lists — list inside list items", () => {
      const groups = [
        { name: "G1", items: ["a", "b"] },
        { name: "G2", items: ["c"] },
      ];

      injectSsr(
        "<div><!--list-start-0-->" +
          "<div><h3><!-- text-0 -->G1</h3>" +
          "<ul><!--list-start-0-->" +
          "<li><!-- text-0 -->a</li>" +
          "<li><!-- text-0 -->b</li>" +
          "<!--list-end--></ul></div>" +
          "<div><h3><!-- text-0 -->G2</h3>" +
          "<ul><!--list-start-0-->" +
          "<li><!-- text-0 -->c</li>" +
          "<!--list-end--></ul></div>" +
          "<!--list-end--></div>",
      );

      const hydratedDiv = hydrate(
        div(
          list(
            () => groups,
            (group) =>
              div(
                h3(group.name),
                ul(
                  list(
                    () => group.items,
                    (item) => li(item),
                  ),
                ),
              ),
          ),
        ),
        container,
      );

      expect(hydratedDiv.querySelectorAll("h3").length).toBe(2);
      expect(hydratedDiv.querySelectorAll("li").length).toBe(3);

      // Add item to second group
      groups[1].items = ["c", "d"];
      update();
      expect(hydratedDiv.querySelectorAll("li").length).toBe(4);
    });
  });

  // =========================================================================
  // Multiple hydrations
  // =========================================================================
  describe("multiple hydrations", () => {
    it("second hydrate() call on already-hydrated container works", () => {
      // First hydration
      let count = 0;
      injectSsr("<div><span><!-- text-0 -->0</span></div>");

      const first = hydrate(div(span(() => String(count))), container);

      count = 1;
      update();
      expect(first.querySelector("span")!.textContent).toContain("1");

      // Clear and re-hydrate with new static content
      container.innerHTML = "<div><p><!-- text-0 -->fresh</p></div>";

      const second = hydrate(div(p("fresh")), container);

      // Second hydration reuses the new SSR HTML
      expect(second.tagName).toBe("DIV");
      expect(second.querySelector("p")!.textContent).toContain("fresh");
      expect(container.children.length).toBe(1);
    });
  });

  // =========================================================================
  // Memory and cleanup
  // =========================================================================
  describe("memory and cleanup", () => {
    it("hydrated reactive text stops updating after element removed", () => {
      let count = 0;
      injectSsr("<div><span><!-- text-0 -->0</span></div>");

      const hydratedDiv = hydrate(div(span(() => String(count))), container);

      const liveSpan = hydratedDiv.querySelector("span")!;

      count = 1;
      update();
      expect(liveSpan.textContent).toContain("1");

      // Remove the element from the DOM
      container.removeChild(hydratedDiv);

      count = 2;
      update();
      // The span should NOT have updated since it's disconnected
      // (reactiveText checks isNodeConnected and cleans up)
      expect(liveSpan.textContent).toContain("1");
    });
  });

  // =========================================================================
  // Static text preservation
  // =========================================================================
  describe("static text", () => {
    it("preserves static text content without creating new text nodes", () => {
      injectSsr("<div><!-- text-0 -->Hello World</div>");
      const existingDiv = container.firstElementChild!;

      const hydratedDiv = hydrate(div("Hello World"), container);

      expect(hydratedDiv).toBe(existingDiv);
      expect(hydratedDiv.textContent).toContain("Hello World");
      expect(container.children.length).toBe(1);
    });

    it("mixed static and reactive text in same parent", () => {
      let count = 0;
      injectSsr("<div><!-- text-0 -->Static <!-- text-1 -->Count: 0</div>");

      const hydratedDiv = hydrate(
        div("Static ", () => `Count: ${count}`),
        container,
      );

      expect(hydratedDiv.textContent).toContain("Static");
      expect(hydratedDiv.textContent).toContain("Count: 0");

      count = 42;
      update();
      expect(hydratedDiv.textContent).toContain("Static");
      expect(hydratedDiv.textContent).toContain("Count: 42");
    });
  });
});
