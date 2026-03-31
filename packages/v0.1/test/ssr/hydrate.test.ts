/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { hydrate } from "../../src/utility/render";
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
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'app';
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
      injectSsr('<section><h1>Title</h1><p>Content</p></section>');
      const existingSection = container.firstElementChild!;
      const existingH1 = existingSection.querySelector('h1')!;
      const existingP = existingSection.querySelector('p')!;

      const hydratedSection = hydrate(
        section(h1("Title"), p("Content")),
        container
      );

      expect(hydratedSection).toBe(existingSection);
      expect(hydratedSection.querySelector('h1')).toBe(existingH1);
      expect(hydratedSection.querySelector('p')).toBe(existingP);
      expect(container.children.length).toBe(1);
    });

    it("preserves attributes from SSR", () => {
      injectSsr('<div id="root" class="container" data-env="server">Body</div>');
      const existingDiv = container.firstElementChild!;

      const hydratedDiv = hydrate(
        div({ id: "root", class: "container", "data-env": "server" }, "Body"),
        container
      );

      expect(hydratedDiv).toBe(existingDiv);
      expect(hydratedDiv.id).toBe('root');
      expect(hydratedDiv.className).toBe('container');
      expect(hydratedDiv.getAttribute('data-env')).toBe('server');
    });
  });

  // =========================================================================
  // Reactive text hydration
  // =========================================================================
  describe("reactive text", () => {
    it("reactive text updates after hydration on existing element", () => {
      let count = 0;
      injectSsr('<div><h1><!-- text-0 -->Count: 0</h1></div>');
      const existingDiv = container.firstElementChild!;
      const existingH1 = existingDiv.querySelector('h1')!;

      const hydratedDiv = hydrate(div(h1(() => `Count: ${count}`)), container);

      expect(hydratedDiv).toBe(existingDiv);
      expect(hydratedDiv.querySelector('h1')).toBe(existingH1);
      expect(existingH1.textContent).toContain('Count: 0');

      count = 7;
      update();
      expect(existingH1.textContent).toContain('Count: 7');
    });

    it("multiple reactive text nodes update correctly", () => {
      let title = "Old";
      let subtitle = "Sub";

      injectSsr('<div><h1><!-- text-0 -->Old</h1><h2><!-- text-0 -->Sub</h2></div>');
      const existingDiv = container.firstElementChild!;

      const hydratedDiv = hydrate(
        div(h1(() => title), h2(() => subtitle)),
        container
      );

      expect(hydratedDiv).toBe(existingDiv);

      title = "New";
      subtitle = "Updated";
      update();

      expect(hydratedDiv.querySelector('h1')!.textContent).toContain('New');
      expect(hydratedDiv.querySelector('h2')!.textContent).toContain('Updated');
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
        div({ class: () => active ? "box active" : "box" }, "Item"),
        container
      );

      expect(hydratedDiv).toBe(existingDiv);
      expect(hydratedDiv.className).toBe('box');

      active = true;
      update();
      expect(hydratedDiv.className).toBe('box active');
    });

    it("reactive disabled toggles after hydration", () => {
      let locked = false;
      injectSsr('<button><!-- text-0 -->Submit</button>');

      const hydratedBtn = hydrate(
        button({ disabled: () => locked }, "Submit"),
        container
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
      injectSsr('<button><!-- text-0 -->Press</button>');
      const existingBtn = container.firstElementChild!;

      const hydratedBtn = hydrate(
        button("Press", on("click", () => { fired = true; })),
        container
      ) as HTMLButtonElement;

      expect(hydratedBtn).toBe(existingBtn);
      expect(fired).toBe(false);
      hydratedBtn.click();
      expect(fired).toBe(true);
    });

    it("counter increments via click on hydrated elements", () => {
      let count = 0;
      injectSsr('<div><span><!-- text-0 -->0</span><button><!-- text-0 -->Inc</button></div>');
      const existingDiv = container.firstElementChild!;

      const hydratedDiv = hydrate(
        div(
          span(() => String(count)),
          button("Inc", on("click", () => { count++; update(); }))
        ),
        container
      );

      expect(hydratedDiv).toBe(existingDiv);

      const liveSpan = hydratedDiv.querySelector('span')!;
      const liveBtn = hydratedDiv.querySelector('button') as HTMLButtonElement;

      expect(liveSpan.textContent).toContain('0');
      liveBtn.click();
      expect(liveSpan.textContent).toContain('1');
      liveBtn.click();
      expect(liveSpan.textContent).toContain('2');
    });
  });

  // =========================================================================
  // when() hydration
  // =========================================================================
  describe("when() — conditional rendering", () => {
    it("reuses existing elements and switches branches", () => {
      let show = true;
      injectSsr('<div><!--when-start-0--><p><!-- text-0 -->Shown</p><!--when-end--></div>');
      const existingDiv = container.firstElementChild!;

      const hydratedDiv = hydrate(
        div(when(() => show, p("Shown")).else(p("Hidden"))),
        container
      );

      expect(hydratedDiv).toBe(existingDiv);
      expect(hydratedDiv.textContent).toContain('Shown');

      show = false;
      update();
      expect(hydratedDiv.textContent).toContain('Hidden');
      expect(hydratedDiv.textContent).not.toContain('Shown');
    });

    it("toggles back and forth after hydration", () => {
      let toggle = false;
      injectSsr('<span><!--when-start-0--><span><!-- text-0 -->OFF</span><!--when-end--></span>');

      const hydratedSpan = hydrate(
        span(when(() => toggle, span("ON")).else(span("OFF"))),
        container
      );

      expect(hydratedSpan.textContent).toContain('OFF');

      toggle = true;
      update();
      expect(hydratedSpan.textContent).toContain('ON');

      toggle = false;
      update();
      expect(hydratedSpan.textContent).toContain('OFF');
    });

    it("multi-branch when() routes correctly after hydration", () => {
      let status: 'loading' | 'error' | 'ready' = 'loading';
      injectSsr('<div><!--when-start-0--><span><!-- text-0 -->Loading…</span><!--when-end--></div>');

      const hydratedDiv = hydrate(
        div(
          when(() => status === 'loading', span("Loading…"))
            .when(() => status === 'error', span("Error!"))
            .else(span("Ready"))
        ),
        container
      );

      expect(hydratedDiv.textContent).toContain('Loading…');

      status = 'error';
      update();
      expect(hydratedDiv.textContent).toContain('Error!');

      status = 'ready';
      update();
      expect(hydratedDiv.textContent).toContain('Ready');
    });

    it("when() with reactive text inside branch", () => {
      let visible = true;
      let label = "hello";
      injectSsr('<div><!--when-start-0--><span><!-- text-0 -->hello</span><!--when-end--></div>');

      const hydratedDiv = hydrate(
        div(when(() => visible, span(() => label)).else(span("hidden"))),
        container
      );

      expect(hydratedDiv.textContent).toContain('hello');

      label = "world";
      update();
      expect(hydratedDiv.textContent).toContain('world');

      visible = false;
      update();
      expect(hydratedDiv.textContent).toContain('hidden');
    });
  });

  // =========================================================================
  // list() hydration
  // =========================================================================
  describe("list() — reactive lists", () => {
    it("reuses existing list items and supports additions", () => {
      let items = ["Apple", "Banana", "Cherry"];
      injectSsr(
        '<ul><!--list-start-0-->' +
        '<li><!-- text-0 -->Apple</li>' +
        '<li><!-- text-0 -->Banana</li>' +
        '<li><!-- text-0 -->Cherry</li>' +
        '<!--list-end--></ul>'
      );
      const existingUl = container.firstElementChild!;
      const existingLis = Array.from(existingUl.querySelectorAll('li'));

      const hydratedUl = hydrate(
        ul(list(() => items, item => li(item))),
        container
      );

      expect(hydratedUl).toBe(existingUl);
      // Existing li elements are reused
      const hydratedLis = Array.from(hydratedUl.querySelectorAll('li'));
      expect(hydratedLis[0]).toBe(existingLis[0]);
      expect(hydratedLis[1]).toBe(existingLis[1]);
      expect(hydratedLis[2]).toBe(existingLis[2]);

      // Add a new item
      items = ["Apple", "Banana", "Cherry", "Date"];
      update();
      expect(hydratedUl.querySelectorAll('li').length).toBe(4);
    });

    it("supports item removal after hydration", () => {
      let items = ["X", "Y", "Z"];
      injectSsr(
        '<ul><!--list-start-0-->' +
        '<li><!-- text-0 -->X</li>' +
        '<li><!-- text-0 -->Y</li>' +
        '<li><!-- text-0 -->Z</li>' +
        '<!--list-end--></ul>'
      );

      const hydratedUl = hydrate(
        ul(list(() => items, item => li(item))),
        container
      );

      items = ["X"];
      update();
      expect(hydratedUl.querySelectorAll('li').length).toBe(1);
      expect(hydratedUl.querySelector('li')!.textContent).toContain('X');
    });

    it("list with reactive text in items updates correctly", () => {
      const item = { id: 1, count: 0 };
      let items = [item];
      injectSsr(
        '<ul><!--list-start-0-->' +
        '<li data-id="1"><!-- text-0 -->Count: 0</li>' +
        '<!--list-end--></ul>'
      );

      const hydratedUl = hydrate(
        ul(list(() => items, it =>
          li({ "data-id": String(it.id) }, () => `Count: ${it.count}`)
        )),
        container
      );

      expect(hydratedUl.querySelector('[data-id="1"]')!.textContent).toContain('Count: 0');

      item.count = 5;
      update();
      expect(hydratedUl.querySelector('[data-id="1"]')!.textContent).toContain('Count: 5');
    });

    it("empty list hydration then populate", () => {
      let items: string[] = [];
      injectSsr('<ul><!--list-start-0--><!--list-end--></ul>');

      const hydratedUl = hydrate(
        ul(list(() => items, item => li(item))),
        container
      );

      expect(hydratedUl.querySelectorAll('li').length).toBe(0);

      items = ["A", "B"];
      update();
      expect(hydratedUl.querySelectorAll('li').length).toBe(2);
    });
  });

  // =========================================================================
  // Combined scenarios
  // =========================================================================
  describe("combined scenarios", () => {
    it("when() inside list() items", () => {
      interface Product { id: number; name: string; inStock: boolean; }
      let products: Product[] = [
        { id: 1, name: "Widget", inStock: true },
        { id: 2, name: "Gadget", inStock: false },
      ];

      injectSsr(
        '<ul><!--list-start-0-->' +
        '<li data-id="1"><span><!-- text-0 -->Widget</span><!--when-start-1--><span><!-- text-0 --> [in stock]</span><!--when-end--></li>' +
        '<li data-id="2"><span><!-- text-0 -->Gadget</span><!--when-start-1--><span><!-- text-0 --> [out of stock]</span><!--when-end--></li>' +
        '<!--list-end--></ul>'
      );

      const hydratedUl = hydrate(
        ul(list(() => products, p =>
          li({ "data-id": String(p.id) },
            span(p.name),
            when(() => p.inStock, span(" [in stock]")).else(span(" [out of stock]"))
          )
        )),
        container
      );

      expect(hydratedUl.querySelector('[data-id="1"]')!.textContent).toContain('in stock');
      expect(hydratedUl.querySelector('[data-id="2"]')!.textContent).toContain('out of stock');

      products[1].inStock = true;
      update();
      expect(hydratedUl.querySelector('[data-id="2"]')!.textContent).toContain('in stock');
    });

    it("list() inside when() branch", () => {
      let show = true;
      let items = ["one", "two"];

      injectSsr(
        '<div><!--when-start-0-->' +
        '<ul><!--list-start-0-->' +
        '<li><!-- text-0 -->one</li>' +
        '<li><!-- text-0 -->two</li>' +
        '<!--list-end--></ul>' +
        '<!--when-end--></div>'
      );

      const hydratedDiv = hydrate(
        div(
          when(() => show,
            ul(list(() => items, item => li(item)))
          ).else(p("hidden"))
        ),
        container
      );

      expect(hydratedDiv.querySelectorAll('li').length).toBe(2);

      items = ["one", "two", "three"];
      update();
      expect(hydratedDiv.querySelectorAll('li').length).toBe(3);

      show = false;
      update();
      expect(hydratedDiv.querySelectorAll('li').length).toBe(0);
      expect(hydratedDiv.textContent).toContain('hidden');
    });

    it("static siblings around when() preserved", () => {
      let show = true;
      injectSsr(
        '<div>' +
        '<p><!-- text-0 -->before</p>' +
        '<!--when-start-1--><span><!-- text-0 -->inside</span><!--when-end-->' +
        '<p><!-- text-0 -->after</p>' +
        '</div>'
      );
      const existingDiv = container.firstElementChild!;
      const existingPs = existingDiv.querySelectorAll('p');

      const hydratedDiv = hydrate(
        div(
          p("before"),
          when(() => show, span("inside")).else(span("else")),
          p("after")
        ),
        container
      );

      expect(hydratedDiv).toBe(existingDiv);
      // Static p elements are the same DOM nodes
      expect(hydratedDiv.querySelectorAll('p')[0]).toBe(existingPs[0]);
      expect(hydratedDiv.querySelectorAll('p')[1]).toBe(existingPs[1]);

      show = false;
      update();
      expect(hydratedDiv.textContent).toContain('else');
      expect(hydratedDiv.textContent).toContain('before');
      expect(hydratedDiv.textContent).toContain('after');
    });

    it("complex app — todo list with hydration", () => {
      interface Todo { id: number; text: string; done: boolean; }
      let todos: Todo[] = [
        { id: 1, text: "Buy milk", done: false },
        { id: 2, text: "Walk dog", done: true },
      ];

      injectSsr(
        '<div>' +
        '<p><!-- text-0 -->1 remaining</p>' +
        '<ul><!--list-start-0-->' +
        '<li data-id="1" class="pending"><span><!-- text-0 -->Buy milk</span>' +
        '<button><!-- text-0 -->toggle</button></li>' +
        '<li data-id="2" class="done"><span><!-- text-0 -->Walk dog</span>' +
        '<button><!-- text-0 -->toggle</button></li>' +
        '<!--list-end--></ul>' +
        '</div>'
      );
      const existingDiv = container.firstElementChild!;

      const hydratedDiv = hydrate(
        div(
          p(() => `${todos.filter(t => !t.done).length} remaining`),
          ul(list(() => todos, todo =>
            li(
              { "data-id": String(todo.id), class: () => todo.done ? "done" : "pending" },
              span(() => todo.text),
              button("toggle", on("click", () => {
                todo.done = !todo.done;
                update();
              }))
            )
          ))
        ),
        container
      );

      expect(hydratedDiv).toBe(existingDiv);
      expect(hydratedDiv.querySelector('p')!.textContent).toContain('1 remaining');

      // Toggle todo #1
      const toggleBtn1 = hydratedDiv.querySelector('[data-id="1"] button') as HTMLButtonElement;
      toggleBtn1.click();
      expect(hydratedDiv.querySelector('[data-id="1"]')!.className).toBe('done');
      expect(hydratedDiv.querySelector('p')!.textContent).toContain('0 remaining');

      // Toggle back
      toggleBtn1.click();
      expect(hydratedDiv.querySelector('[data-id="1"]')!.className).toBe('pending');
      expect(hydratedDiv.querySelector('p')!.textContent).toContain('1 remaining');
    });
  });

  // =========================================================================
  // Container has only SSR content after hydration (no duplicates)
  // =========================================================================
  describe("no duplicate DOM nodes", () => {
    it("container has exactly one child after hydrating a single root", () => {
      injectSsr('<div><h1><!-- text-0 -->Hello</h1></div>');

      hydrate(div(h1("Hello")), container);

      expect(container.children.length).toBe(1);
      expect(container.firstElementChild!.tagName).toBe('DIV');
    });

    it("deeply nested tree has no duplicate elements", () => {
      injectSsr(
        '<main><header><nav><a href="/"><!-- text-0 -->Home</a></nav></header></main>'
      );
      const existingMain = container.firstElementChild!;

      const hydratedMain = hydrate(
        main(header(nav(a({ href: "/" }, "Home")))),
        container
      );

      expect(hydratedMain).toBe(existingMain);
      expect(container.querySelectorAll('main').length).toBe(1);
      expect(container.querySelectorAll('header').length).toBe(1);
      expect(container.querySelectorAll('nav').length).toBe(1);
      expect(container.querySelectorAll('a').length).toBe(1);
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
        '<div>' +
        '<div><span><!-- text-0 -->A=0</span></div>' +
        '<div><span><!-- text-0 -->B=0</span></div>' +
        '</div>'
      );

      const hydratedDiv = hydrate(
        div(
          div(scope("panel-a"), span(() => `A=${counterA}`)),
          div(scope("panel-b"), span(() => `B=${counterB}`))
        ),
        container
      );

      const panels = hydratedDiv.querySelectorAll('div');
      const spanA = panels[0].querySelector('span')!;
      const spanB = panels[1].querySelector('span')!;

      counterA = 1;
      update('panel-a');
      expect(spanA.textContent).toContain('A=1');
      expect(spanB.textContent).toContain('B=0'); // unchanged

      counterB = 9;
      update('panel-b');
      expect(spanB.textContent).toContain('B=9');
    });
  });
});
