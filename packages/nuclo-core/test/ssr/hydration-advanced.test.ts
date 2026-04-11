/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "../../src/utility/render";
import { update } from "../../src/core/updateController";
import { scope } from "../../src/utility/scope";
import "../../src/index";

/**
 * Advanced hydration tests.
 *
 * Areas not yet covered by existing hydration suites:
 *   • scope()-targeted partial updates
 *   • reactive inline styles
 *   • reactive boolean / form attributes (disabled, checked, hidden, value)
 *   • batch state changes committed with a single update()
 *   • rapid / repeated toggling
 *   • shared state across multiple sibling components
 *   • sibling static elements preserved around list markers
 *   • multiple sibling when() blocks inside one parent
 *   • multiple sibling list() blocks inside one parent
 *   • list() sort (reorder without add/remove)
 *   • nested list() inside list() items
 *   • list items with their own click handlers
 *   • custom events dispatched and handled after hydration
 *   • complex app pattern (todo-style: list + when + events + reactive text)
 */
describe("Advanced Hydration", () => {
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
  // scope() — targeted partial updates
  // =========================================================================
  describe("scope() — targeted updates", () => {
    it("update(scopeId) only refreshes the scoped subtree", () => {
      let counterA = 0;
      let counterB = 0;

      const compA = div(
        scope("panel-a"),
        span(() => `A=${counterA}`)
      );
      const compB = div(
        scope("panel-b"),
        span(() => `B=${counterB}`)
      );

      const liveA = render(compA, container);
      const liveB = render(compB, container);

      expect(liveA.querySelector('span')!.textContent).toBe('A=0');
      expect(liveB.querySelector('span')!.textContent).toBe('B=0');

      counterA = 1;
      update('panel-a');

      // Only A updates
      expect(liveA.querySelector('span')!.textContent).toBe('A=1');
      expect(liveB.querySelector('span')!.textContent).toBe('B=0');

      counterB = 9;
      update('panel-b');

      // Only B updates
      expect(liveA.querySelector('span')!.textContent).toBe('A=1');
      expect(liveB.querySelector('span')!.textContent).toBe('B=9');
    });

    it("update() with no scope refreshes everything", () => {
      let x = 0;
      let y = 0;

      const compX = div(scope("sx"), span(() => `x=${x}`));
      const compY = div(scope("sy"), span(() => `y=${y}`));

      const liveX = render(compX, container);
      const liveY = render(compY, container);

      x = 3; y = 7;
      update(); // global update — both must refresh

      expect(liveX.querySelector('span')!.textContent).toBe('x=3');
      expect(liveY.querySelector('span')!.textContent).toBe('y=7');
    });

    it("scoped list update only re-syncs the targeted list", () => {
      let listA = ["A1", "A2"];
      let listB = ["B1", "B2"];

      const compA = div(
        scope("list-scope-a"),
        ul({ class: "la" }, list(() => listA, item => li(item)))
      );
      const compB = div(
        scope("list-scope-b"),
        ul({ class: "lb" }, list(() => listB, item => li(item)))
      );

      const liveA = render(compA, container);
      const liveB = render(compB, container);

      listA = ["A1", "A2", "A3"];
      update('list-scope-a');

      expect(liveA.querySelectorAll('li').length).toBe(3);
      expect(liveB.querySelectorAll('li').length).toBe(2); // unchanged
    });
  });

  // =========================================================================
  // Reactive inline styles
  // =========================================================================
  describe("reactive inline styles", () => {
    it("style object resolver updates inline styles on update()", () => {
      let color = 'red';
      const component = div({
        style: () => ({ color, fontWeight: 'bold' })
      }, "Styled");

      injectSsr('<div style="color:red;font-weight:bold">Styled</div>');
      const liveDiv = render(component, container);

      expect(liveDiv.style.color).toBe('red');

      color = 'blue';
      update();

      expect(liveDiv.style.color).toBe('blue');
    });

    it("multiple style properties update independently", () => {
      let bg = 'white';
      let size = '14px';
      const component = div({
        style: () => ({ backgroundColor: bg, fontSize: size })
      });

      injectSsr('<div></div>');
      const liveDiv = render(component, container);

      bg = 'black'; size = '20px';
      update();

      expect(liveDiv.style.backgroundColor).toBe('black');
      expect(liveDiv.style.fontSize).toBe('20px');
    });

    it("static style object is applied on mount", () => {
      const component = span({ style: { color: 'green', padding: '8px' } }, "Static");

      const liveSpan = render(component, container);

      expect(liveSpan.style.color).toBe('green');
      expect(liveSpan.style.padding).toBe('8px');
    });
  });

  // =========================================================================
  // Reactive boolean / form attributes
  // =========================================================================
  describe("reactive boolean and form attributes", () => {
    it("disabled toggles correctly after hydration", () => {
      let locked = false;
      const component = button(
        { disabled: () => locked },
        "Submit"
      );

      injectSsr('<button>Submit</button>');
      const liveBtn = render(component, container) as HTMLButtonElement;

      expect(liveBtn.disabled).toBe(false);

      locked = true;
      update();
      expect(liveBtn.disabled).toBe(true);

      locked = false;
      update();
      expect(liveBtn.disabled).toBe(false);
    });

    it("hidden attribute toggles visibility", () => {
      let hide = false;
      const component = div({ hidden: () => hide }, "Content");

      injectSsr('<div>Content</div>');
      const liveDiv = render(component, container) as HTMLDivElement;

      expect(liveDiv.hidden).toBe(false);

      hide = true;
      update();
      expect(liveDiv.hidden).toBe(true);
    });

    it("input value updates reactively", () => {
      let val = "initial";
      const component = input({ type: "text", value: () => val });

      injectSsr('<input type="text" value="initial" />');
      const liveInput = render(component, container) as HTMLInputElement;

      expect(liveInput.value).toBe('initial');

      val = "updated";
      update();
      expect(liveInput.value).toBe('updated');
    });

    it("checkbox checked state updates reactively", () => {
      let ticked = false;
      const component = input({ type: "checkbox", checked: () => ticked });

      injectSsr('<input type="checkbox" />');
      const liveInput = render(component, container) as HTMLInputElement;

      expect(liveInput.checked).toBe(false);

      ticked = true;
      update();
      expect(liveInput.checked).toBe(true);
    });
  });

  // =========================================================================
  // Batch state changes + single update()
  // =========================================================================
  describe("batch state changes committed with one update()", () => {
    it("multiple reactive texts all reflect their new values after one update()", () => {
      let title = "Old Title";
      let subtitle = "Old Subtitle";
      let count = 0;

      const component = div(
        h1(() => title),
        h2(() => subtitle),
        span(() => `Count: ${count}`)
      );

      injectSsr('<div><h1>Old Title</h1><h2>Old Subtitle</h2><span>Count: 0</span></div>');
      const liveDiv = render(component, container);

      // Mutate all state at once, then one update()
      title = "New Title";
      subtitle = "New Subtitle";
      count = 42;
      update();

      expect(liveDiv.querySelector('h1')!.textContent).toBe('New Title');
      expect(liveDiv.querySelector('h2')!.textContent).toBe('New Subtitle');
      expect(liveDiv.querySelector('span')!.textContent).toBe('Count: 42');
    });

    it("list mutation and when() condition change batched in one update()", () => {
      let items = ["one", "two"];
      let show = false;

      const component = div(
        ul(list(() => items, item => li(item))),
        when(() => show, p("visible")).else(p("hidden"))
      );

      injectSsr('<div><ul><li>one</li><li>two</li></ul><p>hidden</p></div>');
      const liveDiv = render(component, container);

      // Apply both state mutations, then one update()
      items = ["one", "two", "three"];
      show = true;
      update();

      expect(liveDiv.querySelectorAll('li').length).toBe(3);
      expect(liveDiv.textContent).toContain('visible');
      expect(liveDiv.textContent).not.toContain('hidden');
    });
  });

  // =========================================================================
  // Rapid / repeated toggling
  // =========================================================================
  describe("rapid repeated update() calls", () => {
    it("when() is consistent after many toggles", () => {
      let flag = true;
      const component = div(when(() => flag, span("Y")).else(span("N")));

      const liveDiv = render(component, container);

      for (let i = 0; i < 20; i++) {
        flag = !flag;
        update();
      }
      // After 20 toggles (even number) flag is back to true
      expect(flag).toBe(true);
      expect(liveDiv.textContent).toContain('Y');
      expect(liveDiv.textContent).not.toContain('N');
    });

    it("list() is consistent after many add/remove cycles", () => {
      let items: number[] = [1, 2, 3];
      const component = ul(list(() => items, n => li(String(n))));
      const liveUl = render(component, container);

      for (let i = 0; i < 10; i++) {
        items = [...items, items.length + 1];
        update();
        items = items.slice(0, 3);
        update();
      }

      // Should always end with 3 items
      expect(liveUl.querySelectorAll('li').length).toBe(3);
    });

    it("update() on unchanged state makes no visible difference", () => {
      let val = "stable";
      const component = p(() => val);
      const liveP = render(component, container);

      for (let i = 0; i < 5; i++) update();

      expect(liveP.textContent).toBe('stable');
    });
  });

  // =========================================================================
  // Shared state across sibling components
  // =========================================================================
  describe("shared state across sibling components", () => {
    it("two components reading the same variable both update on update()", () => {
      let sharedCount = 0;

      const compA = div({ id: "a" }, span(() => `A: ${sharedCount}`));
      const compB = div({ id: "b" }, span(() => `B: ${sharedCount}`));

      const liveA = render(compA, container);
      const liveB = render(compB, container);

      expect(liveA.querySelector('span')!.textContent).toBe('A: 0');
      expect(liveB.querySelector('span')!.textContent).toBe('B: 0');

      sharedCount = 5;
      update();

      expect(liveA.querySelector('span')!.textContent).toBe('A: 5');
      expect(liveB.querySelector('span')!.textContent).toBe('B: 5');
    });

    it("one component's event handler mutates state that another component reads", () => {
      let shared = 0;

      const sender = div(
        button("inc", on("click", () => { shared++; update(); }))
      );
      const receiver = div(span(() => `${shared}`));

      const liveSender = render(sender, container);
      const liveReceiver = render(receiver, container);

      const btn = liveSender.querySelector('button') as HTMLButtonElement;
      btn.click();
      btn.click();
      btn.click();

      expect(liveReceiver.querySelector('span')!.textContent).toBe('3');
    });
  });

  // =========================================================================
  // Static siblings preserved around list / when markers
  // =========================================================================
  describe("static siblings are preserved around dynamic regions", () => {
    it("header and footer around a list remain intact after list updates", () => {
      let items = ["a", "b"];
      const component = div(
        h1("Header"),
        ul(list(() => items, item => li(item))),
        footer("Footer")
      );

      injectSsr(
        '<div><h1>Header</h1><ul><li>a</li><li>b</li></ul><footer>Footer</footer></div>'
      );
      const liveDiv = render(component, container);

      items = ["a", "b", "c"];
      update();

      expect(liveDiv.querySelector('h1')!.textContent).toBe('Header');
      expect(liveDiv.querySelector('footer')!.textContent).toBe('Footer');
      expect(liveDiv.querySelectorAll('li').length).toBe(3);
    });

    it("sibling elements around a when() block remain intact after branch switch", () => {
      let show = true;
      const component = div(
        p("before"),
        when(() => show, span("inside")).else(span("else")),
        p("after")
      );

      injectSsr('<div><p>before</p><span>inside</span><p>after</p></div>');
      const liveDiv = render(component, container);

      show = false;
      update();

      expect(liveDiv.querySelector('p')!.textContent).toBe('before');
      expect(liveDiv.querySelectorAll('p')[1].textContent).toBe('after');
      expect(liveDiv.textContent).toContain('else');
    });
  });

  // =========================================================================
  // Multiple sibling when() blocks inside one parent
  // =========================================================================
  describe("multiple sibling when() blocks in one parent", () => {
    it("each when() block is independent", () => {
      let showA = true;
      let showB = false;

      const component = div(
        when(() => showA, span("A-visible")).else(span("A-hidden")),
        when(() => showB, span("B-visible")).else(span("B-hidden"))
      );

      injectSsr('<div><span>A-visible</span><span>B-hidden</span></div>');
      const liveDiv = render(component, container);

      expect(liveDiv.textContent).toContain('A-visible');
      expect(liveDiv.textContent).toContain('B-hidden');

      showA = false;
      update();
      expect(liveDiv.textContent).toContain('A-hidden');
      expect(liveDiv.textContent).toContain('B-hidden');

      showB = true;
      update();
      expect(liveDiv.textContent).toContain('A-hidden');
      expect(liveDiv.textContent).toContain('B-visible');
    });

    it("three sibling when() blocks update independently", () => {
      let flags = [false, false, false];
      const component = div(
        when(() => flags[0], span("0-on")).else(span("0-off")),
        when(() => flags[1], span("1-on")).else(span("1-off")),
        when(() => flags[2], span("2-on")).else(span("2-off"))
      );

      const liveDiv = render(component, container);

      // Flip each flag individually
      for (let i = 0; i < 3; i++) {
        flags[i] = true;
        update();
        expect(liveDiv.textContent).toContain(`${i}-on`);
        // Other blocks must not change
        for (let j = 0; j < 3; j++) {
          if (j !== i) {
            expect(liveDiv.textContent).toContain(`${j}-off`);
          }
        }
        flags[i] = false;
        update();
      }
    });
  });

  // =========================================================================
  // Multiple sibling list() blocks inside one parent
  // =========================================================================
  describe("multiple sibling list() blocks in one parent", () => {
    it("each list updates independently", () => {
      let fruits = ["apple", "banana"];
      let vegs   = ["carrot", "broccoli"];

      const component = div(
        ul({ class: "fruits" }, list(() => fruits, f => li(f))),
        ul({ class: "vegs"   }, list(() => vegs,   v => li(v)))
      );

      injectSsr(
        '<div>' +
        '<ul class="fruits"><li>apple</li><li>banana</li></ul>' +
        '<ul class="vegs"><li>carrot</li><li>broccoli</li></ul>' +
        '</div>'
      );
      const liveDiv = render(component, container);

      fruits = ["apple", "banana", "cherry"];
      update();
      expect(liveDiv.querySelector('.fruits')!.querySelectorAll('li').length).toBe(3);
      expect(liveDiv.querySelector('.vegs')!.querySelectorAll('li').length).toBe(2);

      vegs = [];
      update();
      expect(liveDiv.querySelector('.fruits')!.querySelectorAll('li').length).toBe(3);
      expect(liveDiv.querySelector('.vegs')!.querySelectorAll('li').length).toBe(0);
    });
  });

  // =========================================================================
  // list() sort — reorder without add/remove
  // =========================================================================
  describe("list() sort — reorder without add or remove", () => {
    it("reversing items reorders DOM and preserves element identity", () => {
      interface Row { id: number; name: string; }
      let rows: Row[] = [
        { id: 1, name: "row-1" },
        { id: 2, name: "row-2" },
        { id: 3, name: "row-3" },
      ];
      const component = ul(
        list(() => rows, r => li({ "data-id": String(r.id) }, r.name))
      );

      const liveUl = render(component, container);

      const el1 = liveUl.querySelector('[data-id="1"]');
      const el2 = liveUl.querySelector('[data-id="2"]');
      const el3 = liveUl.querySelector('[data-id="3"]');

      rows = [rows[2], rows[1], rows[0]]; // reverse
      update();

      const lis = liveUl.querySelectorAll('li');
      expect(lis[0].textContent).toBe('row-3');
      expect(lis[1].textContent).toBe('row-2');
      expect(lis[2].textContent).toBe('row-1');

      // Element identity preserved
      expect(liveUl.querySelector('[data-id="1"]')).toBe(el1);
      expect(liveUl.querySelector('[data-id="2"]')).toBe(el2);
      expect(liveUl.querySelector('[data-id="3"]')).toBe(el3);
    });

    it("stable sort (no actual change) does not alter the DOM", () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const component = ul(list(() => items, r => li({ "data-id": String(r.id) }, String(r.id))));
      const liveUl = render(component, container);

      const before = Array.from(liveUl.querySelectorAll('li'));
      update(); // same array reference — nothing changes
      const after = Array.from(liveUl.querySelectorAll('li'));

      expect(after).toEqual(before);
      for (let i = 0; i < 3; i++) expect(after[i]).toBe(before[i]);
    });
  });

  // =========================================================================
  // Nested list() inside list() items
  // =========================================================================
  describe("nested list() inside list() items", () => {
    it("inner list updates when outer item's sub-array changes", () => {
      interface Category { id: number; name: string; tags: string[]; }
      let categories: Category[] = [
        { id: 1, name: "Cat-A", tags: ["x", "y"] },
        { id: 2, name: "Cat-B", tags: ["p"] },
      ];

      const component = ul(
        list(() => categories, cat =>
          li({ "data-cat": String(cat.id) },
            span(cat.name),
            ul({ class: `tags-${cat.id}` },
              list(() => cat.tags, tag => li({ class: "tag" }, tag))
            )
          )
        )
      );

      const liveUl = render(component, container);

      // Initial state
      expect(liveUl.querySelector('.tags-1')!.querySelectorAll('.tag').length).toBe(2);
      expect(liveUl.querySelector('.tags-2')!.querySelectorAll('.tag').length).toBe(1);

      // Add a tag to category 2
      categories[1].tags = ["p", "q", "r"];
      update();

      expect(liveUl.querySelector('.tags-1')!.querySelectorAll('.tag').length).toBe(2); // unchanged
      expect(liveUl.querySelector('.tags-2')!.querySelectorAll('.tag').length).toBe(3);
    });
  });

  // =========================================================================
  // List items with their own event handlers
  // =========================================================================
  describe("list items with click handlers", () => {
    it("each item's handler fires with the correct item data", () => {
      const clicks: string[] = [];
      const items = ["alpha", "beta", "gamma"];

      const component = ul(
        list(() => items, item =>
          li(
            { "data-name": item },
            item,
            on("click", () => clicks.push(item))
          )
        )
      );

      const liveUl = render(component, container);

      (liveUl.querySelector('[data-name="beta"]') as HTMLElement).click();
      (liveUl.querySelector('[data-name="alpha"]') as HTMLElement).click();
      (liveUl.querySelector('[data-name="gamma"]') as HTMLElement).click();

      expect(clicks).toEqual(["beta", "alpha", "gamma"]);
    });

    it("removing a list item removes its event handler", () => {
      const log: string[] = [];
      let items = [{ id: "x" }, { id: "y" }];

      const component = ul(
        list(() => items, item =>
          li({ "data-id": item.id },
            on("click", () => log.push(item.id))
          )
        )
      );
      const liveUl = render(component, container);

      // Click both items
      (liveUl.querySelector('[data-id="x"]') as HTMLElement).click();
      (liveUl.querySelector('[data-id="y"]') as HTMLElement).click();
      expect(log).toEqual(["x", "y"]);

      // Remove item "x"
      items = [{ id: "y" }];
      update();

      expect(liveUl.querySelector('[data-id="x"]')).toBeNull();
      expect(liveUl.querySelector('[data-id="y"]')).not.toBeNull();

      // Only "y" handler can still fire
      (liveUl.querySelector('[data-id="y"]') as HTMLElement).click();
      expect(log).toEqual(["x", "y", "y"]);
    });
  });

  // =========================================================================
  // Custom events dispatched after hydration
  // =========================================================================
  describe("custom events after hydration", () => {
    it("custom event listener wired via on() fires correctly", () => {
      const received: string[] = [];
      const component = div(
        on("app-notify" as any, (e: Event) => {
          received.push((e as CustomEvent).detail);
        })
      );

      const liveDiv = render(component, container);

      liveDiv.dispatchEvent(new CustomEvent("app-notify", { detail: "hello", bubbles: true }));
      liveDiv.dispatchEvent(new CustomEvent("app-notify", { detail: "world", bubbles: true }));

      expect(received).toEqual(["hello", "world"]);
    });
  });

  // =========================================================================
  // Complex app pattern — todo list
  // =========================================================================
  describe("complex app — todo list", () => {
    interface Todo { id: number; text: string; done: boolean; }

    it("renders initial todos and supports toggle, add, and remove", () => {
      let todos: Todo[] = [
        { id: 1, text: "Buy milk",  done: false },
        { id: 2, text: "Walk dog",  done: true  },
        { id: 3, text: "Write tests", done: false },
      ];
      let nextId = 4;

      const component = div(
        // Summary
        p(() => `${todos.filter(t => !t.done).length} remaining`),

        // Todo list
        ul(
          list(() => todos, todo =>
            li(
              { "data-id": String(todo.id), class: () => todo.done ? "done" : "pending" },
              span(() => todo.text),
              button("toggle", on("click", () => {
                todo.done = !todo.done;
                update();
              })),
              button("remove", on("click", () => {
                todos = todos.filter(t => t.id !== todo.id);
                update();
              }))
            )
          )
        ),

        // Add button
        button("add", on("click", () => {
          todos = [...todos, { id: nextId++, text: `Todo ${nextId - 1}`, done: false }];
          update();
        }))
      );

      injectSsr(
        '<div>' +
        '<p>2 remaining</p>' +
        '<ul>' +
        '<li data-id="1" class="pending"><span>Buy milk</span><button>toggle</button><button>remove</button></li>' +
        '<li data-id="2" class="done"><span>Walk dog</span><button>toggle</button><button>remove</button></li>' +
        '<li data-id="3" class="pending"><span>Write tests</span><button>toggle</button><button>remove</button></li>' +
        '</ul>' +
        '<button>add</button>' +
        '</div>'
      );
      const liveDiv = render(component, container);

      // Initial state
      expect(liveDiv.querySelector('p')!.textContent).toBe('2 remaining');
      expect(liveDiv.querySelectorAll('li').length).toBe(3);

      // Toggle todo #1 — now done
      const toggleBtn1 = liveDiv.querySelector('[data-id="1"] button') as HTMLButtonElement;
      toggleBtn1.click();
      expect(liveDiv.querySelector('[data-id="1"]')!.className).toBe('done');
      expect(liveDiv.querySelector('p')!.textContent).toBe('1 remaining');

      // Remove todo #2
      const removeBtn2 = liveDiv.querySelectorAll('[data-id="2"] button')[1] as HTMLButtonElement;
      removeBtn2.click();
      expect(liveDiv.querySelector('[data-id="2"]')).toBeNull();
      expect(liveDiv.querySelectorAll('li').length).toBe(2);

      // Add a new todo
      const addBtn = liveDiv.querySelector('button[class=""]') ??
                     Array.from(liveDiv.querySelectorAll('button')).find(b => b.textContent === 'add');
      (addBtn as HTMLButtonElement).click();
      expect(liveDiv.querySelectorAll('li').length).toBe(3);

      // New todo is pending
      const newLi = Array.from(liveDiv.querySelectorAll('li')).at(-1)!;
      expect(newLi.className).toBe('pending');
    });
  });
});
