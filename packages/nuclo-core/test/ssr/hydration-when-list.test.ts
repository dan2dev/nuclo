/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "../../src/utility/render";
import { update } from "../../src/core/updateController";
import { renderToString } from "../../src/ssr/renderToString";
import "../../src/index";

/**
 * Hydration tests — when() and list()
 *
 * Every test follows the same three-step pattern:
 *   1. Inject the server-produced HTML into the container (simulating what the
 *      browser receives from a Node.js SSR server).
 *   2. Mount the same Nuclo component via render() to activate the live runtime
 *      (reactive text, when-markers, list-markers, event listeners).
 *   3. Assert that state changes are reflected in the live DOM.
 *
 * All DOM queries target the element returned by render(), not the static SSR
 * copy, so tests remain unambiguous even when the container holds both.
 *
 * Internal structure notes:
 *   when()  — inserts <!--when-start-xxx--> … <!--when-end--> comment markers
 *             and manages DOM between them on every update().
 *   list()  — inserts <!--list-start-xxx--> … <!--list-end--> comment markers
 *             and manages DOM between them; element identity is preserved when
 *             the same item reference appears in consecutive syncs.
 */
describe("Hydration — when() and list()", () => {
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
  // when() — conditional rendering
  // =========================================================================
  describe("when()", () => {
    // -----------------------------------------------------------------------
    describe("single condition — no else branch", () => {
      it("renders content when condition is initially true", () => {
        let show = true;
        const component = div(when(() => show, span("present")));

        injectSsr("<div><span>present</span></div>");
        const liveDiv = render(component, container);

        expect(liveDiv.textContent).toContain("present");
      });

      it("renders nothing when condition starts false", () => {
        let show = false;
        const component = div(when(() => show, span("ghost")));

        injectSsr("<div></div>");
        const liveDiv = render(component, container);

        expect(liveDiv.textContent).toBe("");
      });

      it("shows content after condition becomes true", () => {
        let show = false;
        const component = div(when(() => show, span("appeared")));

        injectSsr("<div></div>");
        const liveDiv = render(component, container);

        expect(liveDiv.textContent).toBe("");

        show = true;
        update();

        expect(liveDiv.textContent).toContain("appeared");
      });

      it("hides content after condition becomes false", () => {
        let show = true;
        const component = div(when(() => show, span("vanished")));

        injectSsr("<div><span>vanished</span></div>");
        const liveDiv = render(component, container);

        expect(liveDiv.textContent).toContain("vanished");

        show = false;
        update();

        expect(liveDiv.textContent).toBe("");
      });
    });

    // -----------------------------------------------------------------------
    describe("when().else() — two branches", () => {
      it("switches from true branch to else branch", () => {
        let flag = true;
        const component = div(when(() => flag, p("yes")).else(p("no")));

        injectSsr("<div><p>yes</p></div>");
        const liveDiv = render(component, container);

        expect(liveDiv.textContent).toContain("yes");
        expect(liveDiv.textContent).not.toContain("no");

        flag = false;
        update();

        expect(liveDiv.textContent).toContain("no");
        expect(liveDiv.textContent).not.toContain("yes");
      });

      it("switches from else branch back to true branch", () => {
        let flag = false;
        const component = div(when(() => flag, p("yes")).else(p("no")));

        injectSsr("<div><p>no</p></div>");
        const liveDiv = render(component, container);

        expect(liveDiv.textContent).toContain("no");

        flag = true;
        update();

        expect(liveDiv.textContent).toContain("yes");
        expect(liveDiv.textContent).not.toContain("no");
      });

      it("toggles correctly across multiple transitions", () => {
        let on = true;
        const component = span(when(() => on, "ON").else("OFF"));

        injectSsr("<span>ON</span>");
        const liveSpan = render(component, container);

        for (let i = 0; i < 4; i++) {
          const expected = on ? "ON" : "OFF";
          expect(liveSpan.textContent).toContain(expected);
          on = !on;
          update();
        }
      });
    });

    // -----------------------------------------------------------------------
    describe("when().when().else() — multi-branch chains", () => {
      it("routes to the correct branch based on active condition", () => {
        let status: "loading" | "error" | "ready" = "loading";
        const component = div(
          when(() => status === "loading", span("Loading…"))
            .when(() => status === "error", span("Error!"))
            .else(span("Content ready")),
        );

        injectSsr("<div><span>Loading…</span></div>");
        const liveDiv = render(component, container);

        expect(liveDiv.textContent).toContain("Loading…");

        status = "error";
        update();
        expect(liveDiv.textContent).toContain("Error!");
        expect(liveDiv.textContent).not.toContain("Loading…");

        status = "ready";
        update();
        expect(liveDiv.textContent).toContain("Content ready");
        expect(liveDiv.textContent).not.toContain("Error!");

        status = "loading";
        update();
        expect(liveDiv.textContent).toContain("Loading…");
        expect(liveDiv.textContent).not.toContain("Content ready");
      });

      it("only one branch is active at any time", () => {
        let n = 0;
        const component = div(
          when(() => n === 1, span("one"))
            .when(() => n === 2, span("two"))
            .when(() => n === 3, span("three"))
            .else(span("other")),
        );

        injectSsr("<div><span>other</span></div>");
        const liveDiv = render(component, container);

        const cases: Array<[number, string]> = [
          [1, "one"],
          [2, "two"],
          [3, "three"],
          [0, "other"],
        ];
        for (const [val, text] of cases) {
          n = val;
          update();
          const spans = liveDiv.querySelectorAll("span");
          expect(spans.length).toBe(1);
          expect(spans[0].textContent).toBe(text);
        }
      });
    });

    // -----------------------------------------------------------------------
    describe("when() with multiple content nodes per branch", () => {
      it("renders all nodes of the active branch", () => {
        let logged = false;
        const component = div(
          when(
            () => logged,
            h2("Welcome back"),
            p("Your dashboard is ready"),
            span("✓"),
          ).else(h2("Please log in"), p("Enter your credentials")),
        );

        injectSsr(
          "<div><h2>Please log in</h2><p>Enter your credentials</p></div>",
        );
        const liveDiv = render(component, container);

        expect(liveDiv.querySelectorAll("h2").length).toBe(1);
        expect(liveDiv.querySelectorAll("p").length).toBe(1);
        expect(liveDiv.textContent).toContain("Please log in");

        logged = true;
        update();

        expect(liveDiv.querySelectorAll("h2").length).toBe(1);
        expect(liveDiv.querySelectorAll("p").length).toBe(1);
        expect(liveDiv.querySelectorAll("span").length).toBe(1);
        expect(liveDiv.textContent).toContain("Welcome back");
        expect(liveDiv.textContent).toContain("Your dashboard is ready");
        expect(liveDiv.textContent).not.toContain("Please log in");
      });
    });

    // -----------------------------------------------------------------------
    describe("nested when() inside when()", () => {
      it("inner condition responds independently from outer condition", () => {
        let outer = true;
        let inner = false;
        const component = div(
          when(
            () => outer,
            div(
              { class: "outer-content" },
              when(() => inner, span("inner-true")).else(span("inner-false")),
            ),
          ).else(span("outer-false")),
        );

        injectSsr(
          '<div><div class="outer-content"><span>inner-false</span></div></div>',
        );
        const liveDiv = render(component, container);

        expect(liveDiv.textContent).toContain("inner-false");

        inner = true;
        update();
        expect(liveDiv.textContent).toContain("inner-true");
        expect(liveDiv.textContent).not.toContain("inner-false");

        outer = false;
        update();
        expect(liveDiv.textContent).toContain("outer-false");
        expect(liveDiv.textContent).not.toContain("inner-true");

        outer = true;
        inner = false;
        update();
        expect(liveDiv.textContent).toContain("inner-false");
        expect(liveDiv.textContent).not.toContain("outer-false");
      });
    });

    // -----------------------------------------------------------------------
    describe("when() with reactive text inside branches", () => {
      it("reactive text inside the active branch updates correctly", () => {
        let visible = true;
        let label = "hello";
        const component = div(
          when(
            () => visible,
            span(() => label),
          ).else(span("hidden")),
        );

        injectSsr("<div><span>hello</span></div>");
        const liveDiv = render(component, container);

        expect(liveDiv.textContent).toContain("hello");

        label = "world";
        update();
        expect(liveDiv.textContent).toContain("world");

        visible = false;
        update();
        expect(liveDiv.textContent).toContain("hidden");
        expect(liveDiv.textContent).not.toContain("world");
      });
    });

    // -----------------------------------------------------------------------
    describe("when() SSR output consistency", () => {
      it("SSR correctly captures the true branch", () => {
        let show = true;
        const html = renderToString(
          div(when(() => show, p("visible")).else(p("hidden"))),
        );
        expect(html).toContain("visible");
        expect(html).not.toContain("hidden");
      });

      it("SSR correctly captures the else branch", () => {
        let show = false;
        const html = renderToString(
          div(when(() => show, p("visible")).else(p("hidden"))),
        );
        expect(html).toContain("hidden");
        expect(html).not.toContain("visible");
      });

      it("SSR captures correct branch for multi-condition chain", () => {
        let status = "error";
        const html = renderToString(
          div(
            when(() => status === "loading", span("Loading…"))
              .when(() => status === "error", span("Error!"))
              .else(span("Ready")),
          ),
        );
        expect(html).toContain("Error!");
        expect(html).not.toContain("Loading…");
        expect(html).not.toContain("Ready");
      });
    });
  });

  // =========================================================================
  // list() — reactive lists
  // =========================================================================
  describe("list()", () => {
    // -----------------------------------------------------------------------
    describe("basic item management after hydration", () => {
      it("initial items are rendered correctly", () => {
        let items = ["Apple", "Banana", "Cherry"];
        const component = ul(
          list(
            () => items,
            (item) => li(item),
          ),
        );

        injectSsr("<ul><li>Apple</li><li>Banana</li><li>Cherry</li></ul>");
        const liveUl = render(component, container);

        const lis = liveUl.querySelectorAll("li");
        expect(lis.length).toBe(3);
        expect(lis[0].textContent).toBe("Apple");
        expect(lis[1].textContent).toBe("Banana");
        expect(lis[2].textContent).toBe("Cherry");
      });

      it("appending an item adds one element", () => {
        let items = ["A", "B"];
        const component = ul(
          list(
            () => items,
            (item) => li(item),
          ),
        );

        injectSsr("<ul><li>A</li><li>B</li></ul>");
        const liveUl = render(component, container);

        items = ["A", "B", "C"];
        update();

        const lis = liveUl.querySelectorAll("li");
        expect(lis.length).toBe(3);
        expect(lis[2].textContent).toBe("C");
      });

      it("prepending an item adds one element at the start", () => {
        let items = ["B", "C"];
        const component = ul(
          list(
            () => items,
            (item) => li(item),
          ),
        );

        injectSsr("<ul><li>B</li><li>C</li></ul>");
        const liveUl = render(component, container);

        items = ["A", "B", "C"];
        update();

        const lis = liveUl.querySelectorAll("li");
        expect(lis.length).toBe(3);
        expect(lis[0].textContent).toBe("A");
      });

      it("removing an item from the middle works correctly", () => {
        let items = ["X", "Y", "Z"];
        const component = ul(
          list(
            () => items,
            (item) => li(item),
          ),
        );

        injectSsr("<ul><li>X</li><li>Y</li><li>Z</li></ul>");
        const liveUl = render(component, container);

        items = ["X", "Z"]; // remove Y
        update();

        const lis = liveUl.querySelectorAll("li");
        expect(lis.length).toBe(2);
        expect(lis[0].textContent).toBe("X");
        expect(lis[1].textContent).toBe("Z");
      });

      it("replacing all items renders new content", () => {
        let items = ["old-1", "old-2"];
        const component = ul(
          list(
            () => items,
            (item) => li(item),
          ),
        );

        injectSsr("<ul><li>old-1</li><li>old-2</li></ul>");
        const liveUl = render(component, container);

        items = ["new-1", "new-2", "new-3"];
        update();

        const lis = liveUl.querySelectorAll("li");
        expect(lis.length).toBe(3);
        expect(lis[0].textContent).toBe("new-1");
        expect(lis[1].textContent).toBe("new-2");
        expect(lis[2].textContent).toBe("new-3");
      });

      it("clearing all items leaves an empty list", () => {
        let items = ["1", "2", "3"];
        const component = ul(
          list(
            () => items,
            (item) => li(item),
          ),
        );

        injectSsr("<ul><li>1</li><li>2</li><li>3</li></ul>");
        const liveUl = render(component, container);

        items = [];
        update();

        expect(liveUl.querySelectorAll("li").length).toBe(0);
      });

      it("populating from empty adds all items", () => {
        let items: string[] = [];
        const component = ul(
          list(
            () => items,
            (item) => li(item),
          ),
        );

        injectSsr("<ul></ul>");
        const liveUl = render(component, container);

        expect(liveUl.querySelectorAll("li").length).toBe(0);

        items = ["P", "Q", "R"];
        update();

        expect(liveUl.querySelectorAll("li").length).toBe(3);
      });
    });

    // -----------------------------------------------------------------------
    describe("DOM element identity is preserved across updates", () => {
      it("reorder — existing elements are moved, not recreated", () => {
        interface Task {
          id: number;
          name: string;
        }
        let tasks: Task[] = [
          { id: 1, name: "Task 1" },
          { id: 2, name: "Task 2" },
          { id: 3, name: "Task 3" },
        ];
        const component = ul(
          list(
            () => tasks,
            (task) => li({ "data-id": String(task.id) }, task.name),
          ),
        );

        injectSsr(
          '<ul><li data-id="1">Task 1</li><li data-id="2">Task 2</li><li data-id="3">Task 3</li></ul>',
        );
        const liveUl = render(component, container);

        const el1Before = liveUl.querySelector('[data-id="1"]');
        const el3Before = liveUl.querySelector('[data-id="3"]');

        // Reverse order
        tasks = [tasks[2], tasks[1], tasks[0]];
        update();

        const lis = liveUl.querySelectorAll("li");
        expect(lis[0].textContent).toBe("Task 3");
        expect(lis[1].textContent).toBe("Task 2");
        expect(lis[2].textContent).toBe("Task 1");

        // Same object references — no recreation
        expect(liveUl.querySelector('[data-id="1"]')).toBe(el1Before);
        expect(liveUl.querySelector('[data-id="3"]')).toBe(el3Before);
      });

      it("existing elements survive a partial update that adds new items", () => {
        interface Item {
          id: number;
          label: string;
        }
        let items: Item[] = [
          { id: 1, label: "first" },
          { id: 2, label: "second" },
        ];
        const component = ul(
          list(
            () => items,
            (item) => li({ "data-id": String(item.id) }, item.label),
          ),
        );

        injectSsr(
          '<ul><li data-id="1">first</li><li data-id="2">second</li></ul>',
        );
        const liveUl = render(component, container);

        const elFirstBefore = liveUl.querySelector('[data-id="1"]');

        items = [...items, { id: 3, label: "third" }];
        update();

        expect(liveUl.querySelectorAll("li").length).toBe(3);
        expect(liveUl.querySelector('[data-id="1"]')).toBe(elFirstBefore);
        expect(liveUl.querySelector('[data-id="3"]')!.textContent).toBe(
          "third",
        );
      });
    });

    // -----------------------------------------------------------------------
    describe("list() with object items and reactive text", () => {
      it("renders object fields as text content", () => {
        interface User {
          id: number;
          name: string;
        }
        let users: User[] = [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ];
        const component = ul(
          list(
            () => users,
            (u) => li({ "data-id": String(u.id) }, u.name),
          ),
        );

        injectSsr(
          '<ul><li data-id="1">Alice</li><li data-id="2">Bob</li></ul>',
        );
        const liveUl = render(component, container);

        expect(liveUl.querySelector('[data-id="1"]')!.textContent).toBe(
          "Alice",
        );
        expect(liveUl.querySelector('[data-id="2"]')!.textContent).toBe("Bob");

        users = [...users, { id: 3, name: "Carol" }];
        update();

        expect(liveUl.querySelectorAll("li").length).toBe(3);
        expect(liveUl.querySelector('[data-id="3"]')!.textContent).toBe(
          "Carol",
        );
      });

      it("reactive text inside list items updates when item data changes", () => {
        const item = { id: 1, count: 0 };
        let items = [item];
        const component = ul(
          list(
            () => items,
            (it) =>
              li({ "data-id": String(it.id) }, () => `Count: ${it.count}`),
          ),
        );

        injectSsr('<ul><li data-id="1">Count: 0</li></ul>');
        const liveUl = render(component, container);

        expect(liveUl.querySelector('[data-id="1"]')!.textContent).toBe(
          "Count: 0",
        );

        item.count = 5;
        update();

        expect(liveUl.querySelector('[data-id="1"]')!.textContent).toBe(
          "Count: 5",
        );
      });
    });

    // -----------------------------------------------------------------------
    describe("two independent lists in the same container", () => {
      it("updating one list does not affect the other", () => {
        let list1Items = ["A", "B"];
        let list2Items = ["X", "Y"];

        const component = div(
          ul(
            { class: "list-1" },
            list(
              () => list1Items,
              (item) => li(item),
            ),
          ),
          ul(
            { class: "list-2" },
            list(
              () => list2Items,
              (item) => li(item),
            ),
          ),
        );

        injectSsr(
          "<div>" +
            '<ul class="list-1"><li>A</li><li>B</li></ul>' +
            '<ul class="list-2"><li>X</li><li>Y</li></ul>' +
            "</div>",
        );
        const liveDiv = render(component, container);

        list1Items = ["A", "B", "C"];
        update();

        expect(
          liveDiv.querySelector(".list-1")!.querySelectorAll("li").length,
        ).toBe(3);
        expect(
          liveDiv.querySelector(".list-2")!.querySelectorAll("li").length,
        ).toBe(2);

        list2Items = [];
        update();

        expect(
          liveDiv.querySelector(".list-1")!.querySelectorAll("li").length,
        ).toBe(3);
        expect(
          liveDiv.querySelector(".list-2")!.querySelectorAll("li").length,
        ).toBe(0);
      });
    });

    // -----------------------------------------------------------------------
    describe("list() SSR output consistency", () => {
      it("SSR renders all items correctly", () => {
        const items = ["Foo", "Bar", "Baz"];
        const html = renderToString(
          ul(
            list(
              () => items,
              (item) => li(item),
            ),
          ),
        );
        expect(html).toContain("Foo");
        expect(html).toContain("Bar");
        expect(html).toContain("Baz");
        expect(html).toContain("<li");
        expect(html).toContain("<ul");
      });

      it("SSR renders an empty list as an empty ul", () => {
        const html = renderToString(
          ul(
            list(
              () => [],
              () => li("x"),
            ),
          ),
        );
        expect(html).toContain("<ul");
        expect(html).not.toContain("<li");
      });
    });
  });

  // =========================================================================
  // Combinations — when() inside list() and vice-versa
  // =========================================================================
  describe("when() inside list() items", () => {
    it("each list item can have its own conditional branch", () => {
      interface Product {
        id: number;
        name: string;
        inStock: boolean;
      }
      let products: Product[] = [
        { id: 1, name: "Widget", inStock: true },
        { id: 2, name: "Gadget", inStock: false },
        { id: 3, name: "Doohickey", inStock: true },
      ];

      const component = ul(
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
      );

      injectSsr(
        "<ul>" +
          '<li data-id="1"><span>Widget</span><span> [in stock]</span></li>' +
          '<li data-id="2"><span>Gadget</span><span> [out of stock]</span></li>' +
          '<li data-id="3"><span>Doohickey</span><span> [in stock]</span></li>' +
          "</ul>",
      );
      const liveUl = render(component, container);

      expect(liveUl.querySelector('[data-id="1"]')!.textContent).toContain(
        "in stock",
      );
      expect(liveUl.querySelector('[data-id="2"]')!.textContent).toContain(
        "out of stock",
      );

      // Mark Gadget as back in stock
      products[1].inStock = true;
      update();

      expect(liveUl.querySelector('[data-id="2"]')!.textContent).toContain(
        "in stock",
      );
      expect(liveUl.querySelector('[data-id="2"]')!.textContent).not.toContain(
        "out of stock",
      );
    });

    it("a list item removed via list update also cleans its when() runtime", () => {
      interface Item {
        id: number;
        flagged: boolean;
      }
      let items: Item[] = [
        { id: 1, flagged: true },
        { id: 2, flagged: false },
      ];

      const component = ul(
        list(
          () => items,
          (it) =>
            li(
              { "data-id": String(it.id) },
              when(() => it.flagged, span("FLAG")).else(span("-")),
            ),
        ),
      );

      injectSsr(
        "<ul>" +
          '<li data-id="1"><span>FLAG</span></li>' +
          '<li data-id="2"><span>-</span></li>' +
          "</ul>",
      );
      const liveUl = render(component, container);

      expect(liveUl.querySelectorAll("li").length).toBe(2);

      // Remove the first item
      items = [items[1]];
      update();

      expect(liveUl.querySelectorAll("li").length).toBe(1);
      expect(liveUl.querySelector('[data-id="1"]')).toBeNull();
      expect(liveUl.querySelector('[data-id="2"]')).not.toBeNull();
    });
  });

  describe("list() inside when() branch", () => {
    it("list is live only while the enclosing when() branch is active", () => {
      let show = true;
      let items = ["one", "two", "three"];
      const component = div(
        when(
          () => show,
          ul(
            list(
              () => items,
              (item) => li(item),
            ),
          ),
        ).else(p("list is hidden")),
      );

      injectSsr("<div><ul><li>one</li><li>two</li><li>three</li></ul></div>");
      const liveDiv = render(component, container);

      expect(liveDiv.querySelectorAll("li").length).toBe(3);

      // Modify list while it is visible
      items = ["one", "two", "three", "four"];
      update();
      expect(liveDiv.querySelectorAll("li").length).toBe(4);

      // Hide the list via the when() condition
      show = false;
      update();
      expect(liveDiv.querySelectorAll("li").length).toBe(0);
      expect(liveDiv.textContent).toContain("list is hidden");

      // Show the list again — it should re-render with the current items state
      show = true;
      update();
      expect(liveDiv.querySelectorAll("li").length).toBe(4);
    });

    it("list modifications while hidden take effect when branch becomes visible", () => {
      let show = false;
      let items: string[] = [];
      const component = div(
        when(
          () => show,
          ul(
            list(
              () => items,
              (item) => li(item),
            ),
          ),
        ),
      );

      injectSsr("<div></div>");
      const liveDiv = render(component, container);

      // List is hidden; mutate state while hidden
      items = ["alpha", "beta"];

      // Still hidden — no list elements
      expect(liveDiv.querySelectorAll("li").length).toBe(0);

      show = true;
      update();

      expect(liveDiv.querySelectorAll("li").length).toBe(2);
      expect(liveDiv.querySelectorAll("li")[0].textContent).toBe("alpha");
      expect(liveDiv.querySelectorAll("li")[1].textContent).toBe("beta");
    });
  });
});
