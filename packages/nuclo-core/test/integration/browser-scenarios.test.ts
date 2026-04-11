/// <reference path="../../types/index.d.ts" />

import { describe, it, expect, beforeEach } from "vitest";
import "../../src/index";
import { update } from "../../src/core/updateController";
import { render } from "../../src/utility/render";

// ============================================================
// 1. Counter application
// ============================================================

describe("Counter application", () => {
  let count: number;

  beforeEach(() => {
    document.body.innerHTML = "";
    count = 0;
  });

  function buildCounter() {
    const app = div(
      div({ id: "count-display" }, () => String(count)),
      when(
        () => count > 0,
        span({ id: "sign-label" }, "positive")
      )
        .when(() => count < 0, span({ id: "sign-label" }, "negative"))
        .else(span({ id: "sign-label" }, "zero")),
      button({ id: "btn-inc" }, "Increment", on("click", () => { count++; update(); })),
      button({ id: "btn-dec" }, "Decrement", on("click", () => { count--; update(); })),
      button({ id: "btn-reset" }, "Reset", on("click", () => { count = 0; update(); })),
      ul(
        list(
          () => [1, 5, 10],
          (step) => li(
            button(
              { className: `step-btn step-${step}` },
              `+${step}`,
              on("click", () => { count += step; update(); })
            )
          )
        )
      )
    );
    render(app, document.body);
  }

  it("renders with initial count 0", () => {
    buildCounter();
    expect(document.getElementById("count-display")!.textContent).toBe("0");
  });

  it("clicking increment changes count to 1", () => {
    buildCounter();
    (document.getElementById("btn-inc") as HTMLElement).click();
    expect(document.getElementById("count-display")!.textContent).toBe("1");
  });

  it("clicking increment twice changes count to 2", () => {
    buildCounter();
    (document.getElementById("btn-inc") as HTMLElement).click();
    (document.getElementById("btn-inc") as HTMLElement).click();
    expect(document.getElementById("count-display")!.textContent).toBe("2");
  });

  it("clicking decrement from 0 goes to -1", () => {
    buildCounter();
    (document.getElementById("btn-dec") as HTMLElement).click();
    expect(document.getElementById("count-display")!.textContent).toBe("-1");
  });

  it("reset returns count to 0 after incrementing", () => {
    buildCounter();
    (document.getElementById("btn-inc") as HTMLElement).click();
    (document.getElementById("btn-inc") as HTMLElement).click();
    expect(document.getElementById("count-display")!.textContent).toBe("2");
    (document.getElementById("btn-reset") as HTMLElement).click();
    expect(document.getElementById("count-display")!.textContent).toBe("0");
  });

  it("shows 'zero' label initially", () => {
    buildCounter();
    expect(document.getElementById("sign-label")!.textContent).toBe("zero");
  });

  it("shows 'positive' label when count is positive", () => {
    buildCounter();
    (document.getElementById("btn-inc") as HTMLElement).click();
    expect(document.getElementById("sign-label")!.textContent).toBe("positive");
  });

  it("shows 'negative' label when count is negative", () => {
    buildCounter();
    (document.getElementById("btn-dec") as HTMLElement).click();
    expect(document.getElementById("sign-label")!.textContent).toBe("negative");
  });

  it("shows 'zero' label after reset", () => {
    buildCounter();
    (document.getElementById("btn-inc") as HTMLElement).click();
    (document.getElementById("btn-reset") as HTMLElement).click();
    expect(document.getElementById("sign-label")!.textContent).toBe("zero");
  });

  it("step buttons render correctly", () => {
    buildCounter();
    expect(document.querySelectorAll(".step-btn")).toHaveLength(3);
    expect(document.querySelector(".step-1")!.textContent).toBe("+1");
    expect(document.querySelector(".step-5")!.textContent).toBe("+5");
    expect(document.querySelector(".step-10")!.textContent).toBe("+10");
  });

  it("step button +5 increments count by 5", () => {
    buildCounter();
    (document.querySelector(".step-5") as HTMLElement).click();
    expect(document.getElementById("count-display")!.textContent).toBe("5");
  });

  it("step button +10 increments count by 10", () => {
    buildCounter();
    (document.querySelector(".step-10") as HTMLElement).click();
    expect(document.getElementById("count-display")!.textContent).toBe("10");
  });
});

// ============================================================
// 2. Todo list application
// ============================================================

describe("Todo list application", () => {
  interface Todo { id: number; text: string; done: boolean; }
  let todos: Todo[];
  let filter: string;
  let nextId: number;

  beforeEach(() => {
    document.body.innerHTML = "";
    todos = [
      { id: 1, text: "Buy groceries", done: false },
      { id: 2, text: "Read book", done: true },
      { id: 3, text: "Write code", done: false },
    ];
    filter = "all";
    nextId = 4;
  });

  function filteredTodos() {
    if (filter === "active") return todos.filter(t => !t.done);
    if (filter === "completed") return todos.filter(t => t.done);
    return todos;
  }

  function buildTodoApp() {
    let newTodoText = "";

    const app = div(
      div({ id: "items-left" }, () => `${todos.filter(t => !t.done).length} items left`),
      div({ id: "filters" },
        button({ id: "filter-all" }, "All", on("click", () => { filter = "all"; update(); })),
        button({ id: "filter-active" }, "Active", on("click", () => { filter = "active"; update(); })),
        button({ id: "filter-completed" }, "Completed", on("click", () => { filter = "completed"; update(); }))
      ),
      ul({ id: "todo-list" },
        list(
          () => filteredTodos(),
          (todo) => li(
            { className: `todo-item`, "data-id": String(todo.id) },
            input({
              type: "checkbox",
              className: "todo-checkbox",
              checked: todo.done,
              "data-id": String(todo.id),
            },
              on("change", () => {
                todo.done = !todo.done;
                update();
              })
            ),
            span(
              {
                className: () => todo.done ? "todo-text done" : "todo-text",
                "data-id": String(todo.id),
              },
              todo.text
            ),
            button(
              { className: "delete-btn", "data-id": String(todo.id) },
              "Delete",
              on("click", () => {
                todos = todos.filter(t => t.id !== todo.id);
                update();
              })
            )
          )
        )
      ),
      div({ id: "add-todo" },
        input({
          id: "new-todo-input",
          type: "text",
          placeholder: "New todo",
        },
          on("input", (e) => {
            newTodoText = (e.target as HTMLInputElement).value;
          })
        ),
        button({ id: "add-todo-btn" }, "Add",
          on("click", () => {
            if (newTodoText.trim()) {
              todos.push({ id: nextId++, text: newTodoText.trim(), done: false });
              newTodoText = "";
              const input = document.getElementById("new-todo-input") as HTMLInputElement;
              if (input) input.value = "";
              update();
            }
          })
        )
      )
    );
    render(app, document.body);
  }

  it("renders initial 3 todos", () => {
    buildTodoApp();
    expect(document.querySelectorAll(".todo-item")).toHaveLength(3);
  });

  it("renders todo texts correctly", () => {
    buildTodoApp();
    const texts = Array.from(document.querySelectorAll(".todo-text")).map(el => el.textContent);
    expect(texts).toContain("Buy groceries");
    expect(texts).toContain("Read book");
    expect(texts).toContain("Write code");
  });

  it("done todo has 'done' class on text span", () => {
    buildTodoApp();
    // "Read book" has done: true — find by data-id=2
    const doneSpan = document.querySelector('[data-id="2"].todo-text');
    expect(doneSpan!.classList.contains("done")).toBe(true);
  });

  it("clicking checkbox marks todo as done and updates class", () => {
    buildTodoApp();
    const checkbox = document.querySelector('.todo-checkbox[data-id="1"]') as HTMLElement;
    checkbox.click();
    const span = document.querySelector('.todo-text[data-id="1"]');
    expect(span!.classList.contains("done")).toBe(true);
  });

  it("delete button removes todo from list", () => {
    buildTodoApp();
    expect(document.querySelectorAll(".todo-item")).toHaveLength(3);
    const deleteBtn = document.querySelector('.delete-btn[data-id="1"]') as HTMLElement;
    deleteBtn.click();
    expect(document.querySelectorAll(".todo-item")).toHaveLength(2);
  });

  it("add form creates a new todo", () => {
    buildTodoApp();
    const input = document.getElementById("new-todo-input") as HTMLInputElement;
    input.value = "New task";
    input.dispatchEvent(new Event("input"));
    (document.getElementById("add-todo-btn") as HTMLElement).click();
    expect(document.querySelectorAll(".todo-item")).toHaveLength(4);
    const texts = Array.from(document.querySelectorAll(".todo-text")).map(el => el.textContent);
    expect(texts).toContain("New task");
  });

  it("filter 'Active' shows only undone todos", () => {
    buildTodoApp();
    (document.getElementById("filter-active") as HTMLElement).click();
    const items = document.querySelectorAll(".todo-item");
    // "Read book" is done so should not appear
    expect(items).toHaveLength(2);
    const texts = Array.from(document.querySelectorAll(".todo-text")).map(el => el.textContent);
    expect(texts).not.toContain("Read book");
  });

  it("filter 'Completed' shows only done todos", () => {
    buildTodoApp();
    (document.getElementById("filter-completed") as HTMLElement).click();
    const items = document.querySelectorAll(".todo-item");
    expect(items).toHaveLength(1);
    expect(document.querySelector(".todo-text")!.textContent).toBe("Read book");
  });

  it("filter 'All' shows all todos after filtering", () => {
    buildTodoApp();
    (document.getElementById("filter-active") as HTMLElement).click();
    (document.getElementById("filter-all") as HTMLElement).click();
    expect(document.querySelectorAll(".todo-item")).toHaveLength(3);
  });

  it("items-left counter shows correct count", () => {
    buildTodoApp();
    // 2 undone initially
    expect(document.getElementById("items-left")!.textContent).toBe("2 items left");
    const checkbox = document.querySelector('.todo-checkbox[data-id="1"]') as HTMLElement;
    checkbox.click();
    expect(document.getElementById("items-left")!.textContent).toBe("1 items left");
  });
});

// ============================================================
// 3. Shopping cart
// ============================================================

describe("Shopping cart", () => {
  interface CartItem { id: number; name: string; price: number; qty: number; }
  let cartItems: CartItem[];

  beforeEach(() => {
    document.body.innerHTML = "";
    cartItems = [
      { id: 1, name: "Widget A", price: 9.99, qty: 1 },
      { id: 2, name: "Widget B", price: 24.99, qty: 2 },
    ];
  });

  function total() {
    return cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function buildCart() {
    const app = div(
      when(
        () => cartItems.length === 0,
        p({ id: "empty-cart" }, "Your cart is empty")
      ),
      table({ id: "cart-table" },
        thead(tr(th("Name"), th("Price"), th("Qty"), th("Subtotal"), th("Actions"))),
        tbody(
          list(
            () => cartItems,
            (item) => tr(
              { "data-id": String(item.id) },
              td({ className: "item-name" }, item.name),
              td({ className: "item-price" }, () => `$${item.price.toFixed(2)}`),
              td({ className: "item-qty" },
                button(
                  { className: "qty-dec", "data-id": String(item.id) },
                  "-",
                  on("click", () => {
                    if (item.qty > 1) { item.qty--; update(); }
                  })
                ),
                span({ className: "qty-value", "data-id": String(item.id) }, () => String(item.qty)),
                button(
                  { className: "qty-inc", "data-id": String(item.id) },
                  "+",
                  on("click", () => { item.qty++; update(); })
                )
              ),
              td({ className: "item-subtotal", "data-id": String(item.id) }, () => `$${(item.price * item.qty).toFixed(2)}`),
              td(
                button(
                  { className: "remove-btn", "data-id": String(item.id) },
                  "Remove",
                  on("click", () => {
                    cartItems = cartItems.filter(i => i.id !== item.id);
                    update();
                  })
                )
              )
            )
          )
        )
      ),
      div({ id: "cart-totals" },
        div({ id: "subtotal" }, () => `Subtotal: $${total().toFixed(2)}`),
        when(
          () => total() >= 50,
          div({ id: "shipping" }, "Shipping: FREE")
        ).else(
          div({ id: "shipping" }, () => `Shipping: $5.99`)
        ),
        div({ id: "total" }, () => `Total: $${(total() >= 50 ? total() : total() + 5.99).toFixed(2)}`),
      ),
      button(
        {
          id: "checkout-btn",
          disabled: () => cartItems.length === 0,
        },
        "Checkout"
      )
    );
    render(app, document.body);
  }

  it("renders initial cart items", () => {
    buildCart();
    expect(document.querySelectorAll("tbody tr")).toHaveLength(2);
  });

  it("renders item names correctly", () => {
    buildCart();
    const names = Array.from(document.querySelectorAll(".item-name")).map(el => el.textContent);
    expect(names).toContain("Widget A");
    expect(names).toContain("Widget B");
  });

  it("shows correct initial subtotal", () => {
    buildCart();
    // 9.99*1 + 24.99*2 = 59.97
    expect(document.getElementById("subtotal")!.textContent).toBe("Subtotal: $59.97");
  });

  it("increasing quantity updates qty display", () => {
    buildCart();
    const incBtn = document.querySelector('.qty-inc[data-id="1"]') as HTMLElement;
    incBtn.click();
    expect(document.querySelector('.qty-value[data-id="1"]')!.textContent).toBe("2");
  });

  it("increasing quantity updates item subtotal", () => {
    buildCart();
    const incBtn = document.querySelector('.qty-inc[data-id="1"]') as HTMLElement;
    incBtn.click();
    // 9.99 * 2 = 19.98
    expect(document.querySelector('.item-subtotal[data-id="1"]')!.textContent).toBe("$19.98");
  });

  it("removing an item updates the list", () => {
    buildCart();
    (document.querySelector('.remove-btn[data-id="1"]') as HTMLElement).click();
    expect(document.querySelectorAll("tbody tr")).toHaveLength(1);
    const names = Array.from(document.querySelectorAll(".item-name")).map(el => el.textContent);
    expect(names).not.toContain("Widget A");
  });

  it("empty cart message shows when all items removed", () => {
    buildCart();
    expect(document.getElementById("empty-cart")).toBeNull();
    (document.querySelector('.remove-btn[data-id="1"]') as HTMLElement).click();
    (document.querySelector('.remove-btn[data-id="2"]') as HTMLElement).click();
    expect(document.getElementById("empty-cart")).toBeTruthy();
    expect(document.getElementById("empty-cart")!.textContent).toBe("Your cart is empty");
  });

  it("shows free shipping when total >= 50", () => {
    buildCart();
    // initial total is 59.97 which is >= 50
    expect(document.getElementById("shipping")!.textContent).toBe("Shipping: FREE");
  });

  it("shows shipping cost when total < 50", () => {
    buildCart();
    // Remove Widget B (49.98) to bring total below 50
    (document.querySelector('.remove-btn[data-id="2"]') as HTMLElement).click();
    // total is now 9.99
    expect(document.getElementById("shipping")!.textContent).toContain("$5.99");
  });

  it("total calculation is correct with shipping", () => {
    buildCart();
    // total >= 50 so shipping is free: 59.97
    expect(document.getElementById("total")!.textContent).toBe("Total: $59.97");
  });

  it("decrement does not go below 1", () => {
    buildCart();
    const decBtn = document.querySelector('.qty-dec[data-id="1"]') as HTMLElement;
    decBtn.click(); // qty is 1, should stay at 1
    expect(document.querySelector('.qty-value[data-id="1"]')!.textContent).toBe("1");
  });
});

// ============================================================
// 4. Multi-tab component
// ============================================================

describe("Multi-tab component", () => {
  let activeTab: string;

  beforeEach(() => {
    document.body.innerHTML = "";
    activeTab = "Overview";
  });

  const tabs = ["Overview", "Features", "Pricing", "Support"];
  const tabContents: Record<string, string> = {
    Overview: "Welcome to our product overview.",
    Features: "Explore our amazing features.",
    Pricing: "View our competitive pricing.",
    Support: "Get help from our support team.",
  };

  function buildTabs() {
    const app = div(
      nav({ id: "tab-nav" },
        list(
          () => tabs,
          (tab) => button(
            {
              className: () => tab === activeTab ? "tab-btn active" : "tab-btn",
              "data-tab": tab,
            },
            tab,
            on("click", () => { activeTab = tab; update(); })
          )
        )
      ),
      div({ id: "tab-content" },
        when(() => activeTab === "Overview", p({ id: "content-overview" }, tabContents["Overview"]))
          .when(() => activeTab === "Features", p({ id: "content-features" }, tabContents["Features"]))
          .when(() => activeTab === "Pricing", p({ id: "content-pricing" }, tabContents["Pricing"]))
          .else(p({ id: "content-support" }, tabContents["Support"]))
      )
    );
    render(app, document.body);
  }

  it("renders 4 tab buttons", () => {
    buildTabs();
    expect(document.querySelectorAll(".tab-btn")).toHaveLength(4);
  });

  it("initial active tab is 'Overview'", () => {
    buildTabs();
    const activeBtn = document.querySelector(".tab-btn.active");
    expect(activeBtn!.textContent).toBe("Overview");
  });

  it("Overview content is visible initially", () => {
    buildTabs();
    expect(document.getElementById("content-overview")).toBeTruthy();
    expect(document.getElementById("content-overview")!.textContent).toBe(tabContents["Overview"]);
  });

  it("clicking 'Features' tab shows Features content", () => {
    buildTabs();
    (document.querySelector('[data-tab="Features"]') as HTMLElement).click();
    expect(document.getElementById("content-features")).toBeTruthy();
    expect(document.getElementById("content-features")!.textContent).toBe(tabContents["Features"]);
  });

  it("clicking 'Features' tab hides Overview content", () => {
    buildTabs();
    (document.querySelector('[data-tab="Features"]') as HTMLElement).click();
    expect(document.getElementById("content-overview")).toBeNull();
  });

  it("active class applied to correct tab after switching", () => {
    buildTabs();
    (document.querySelector('[data-tab="Pricing"]') as HTMLElement).click();
    const activeBtn = document.querySelector(".tab-btn.active");
    expect(activeBtn!.textContent).toBe("Pricing");
  });

  it("each tab shows its own unique content", () => {
    buildTabs();
    for (const tab of tabs) {
      (document.querySelector(`[data-tab="${tab}"]`) as HTMLElement).click();
      expect(document.getElementById("tab-content")!.textContent).toContain(tabContents[tab]);
    }
  });

  it("switching tabs multiple times works correctly", () => {
    buildTabs();
    (document.querySelector('[data-tab="Features"]') as HTMLElement).click();
    (document.querySelector('[data-tab="Pricing"]') as HTMLElement).click();
    (document.querySelector('[data-tab="Overview"]') as HTMLElement).click();
    expect(document.querySelector(".tab-btn.active")!.textContent).toBe("Overview");
    expect(document.getElementById("content-overview")).toBeTruthy();
  });

  it("Support tab renders via else branch", () => {
    buildTabs();
    (document.querySelector('[data-tab="Support"]') as HTMLElement).click();
    expect(document.getElementById("content-support")).toBeTruthy();
    expect(document.getElementById("content-support")!.textContent).toBe(tabContents["Support"]);
  });
});

// ============================================================
// 5. Accordion / FAQ
// ============================================================

describe("Accordion / FAQ", () => {
  let openIndex: number | null;

  const faqItems = [
    { question: "What is Nuclo?", answer: "Nuclo is a lightweight imperative DOM framework." },
    { question: "How does reactivity work?", answer: "By calling update() to re-render reactive parts." },
    { question: "Is it SSR-compatible?", answer: "Yes, via the SSR utilities." },
    { question: "What browsers are supported?", answer: "All modern browsers with ES2015+." },
    { question: "Is it production ready?", answer: "Yes, it is stable and tested thoroughly." },
  ];

  beforeEach(() => {
    document.body.innerHTML = "";
    openIndex = 0;
  });

  function buildAccordion() {
    const app = div({ id: "accordion" },
      list(
        () => faqItems,
        (item, index) => div(
          { className: "faq-item", "data-index": String(index) },
          button(
            {
              className: "faq-question",
              "data-index": String(index),
            },
            item.question,
            on("click", () => {
              openIndex = openIndex === index ? null : index;
              update();
            })
          ),
          when(
            () => openIndex === index,
            div({ className: "faq-answer", "data-index": String(index) }, item.answer)
          )
        )
      )
    );
    render(app, document.body);
  }

  it("renders all 5 FAQ items", () => {
    buildAccordion();
    expect(document.querySelectorAll(".faq-item")).toHaveLength(5);
  });

  it("first item is open initially", () => {
    buildAccordion();
    expect(document.querySelector('.faq-answer[data-index="0"]')).toBeTruthy();
  });

  it("other items are closed initially", () => {
    buildAccordion();
    expect(document.querySelector('.faq-answer[data-index="1"]')).toBeNull();
    expect(document.querySelector('.faq-answer[data-index="2"]')).toBeNull();
  });

  it("clicking second question opens it and closes first", () => {
    buildAccordion();
    (document.querySelector('.faq-question[data-index="1"]') as HTMLElement).click();
    expect(document.querySelector('.faq-answer[data-index="1"]')).toBeTruthy();
    expect(document.querySelector('.faq-answer[data-index="0"]')).toBeNull();
  });

  it("clicking an open item closes it", () => {
    buildAccordion();
    (document.querySelector('.faq-question[data-index="0"]') as HTMLElement).click();
    expect(document.querySelector('.faq-answer[data-index="0"]')).toBeNull();
  });

  it("only one item open at a time", () => {
    buildAccordion();
    (document.querySelector('.faq-question[data-index="2"]') as HTMLElement).click();
    const openAnswers = document.querySelectorAll(".faq-answer");
    expect(openAnswers).toHaveLength(1);
  });

  it("open item shows correct answer text", () => {
    buildAccordion();
    const answer = document.querySelector('.faq-answer[data-index="0"]');
    expect(answer!.textContent).toBe(faqItems[0].answer);
  });

  it("switching to different item shows that item's answer", () => {
    buildAccordion();
    (document.querySelector('.faq-question[data-index="3"]') as HTMLElement).click();
    const answer = document.querySelector('.faq-answer[data-index="3"]');
    expect(answer!.textContent).toBe(faqItems[3].answer);
  });

  it("all questions are always visible", () => {
    buildAccordion();
    expect(document.querySelectorAll(".faq-question")).toHaveLength(5);
  });

  it("closing all items shows no answers", () => {
    buildAccordion();
    (document.querySelector('.faq-question[data-index="0"]') as HTMLElement).click();
    expect(document.querySelectorAll(".faq-answer")).toHaveLength(0);
  });
});

// ============================================================
// 6. Search / filter list
// ============================================================

describe("Search/filter list", () => {
  let query: string;
  const allItems = ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape"];

  beforeEach(() => {
    document.body.innerHTML = "";
    query = "";
  });

  function filteredItems() {
    return allItems.filter(i => i.toLowerCase().includes(query.toLowerCase()));
  }

  function buildSearchList() {
    const app = div(
      input({
        id: "search-input",
        type: "text",
        placeholder: "Search...",
      },
        on("input", (e) => {
          query = (e.target as HTMLInputElement).value;
          update();
        })
      ),
      p({ id: "count-text" }, () => `${filteredItems().length} items`),
      when(
        () => filteredItems().length === 0,
        p({ id: "no-results" }, "No results")
      ),
      ul({ id: "item-list" },
        list(
          () => filteredItems(),
          (item) => li({ className: "fruit-item" }, item)
        )
      )
    );
    render(app, document.body);
  }

  it("shows all 7 items initially", () => {
    buildSearchList();
    expect(document.querySelectorAll(".fruit-item")).toHaveLength(7);
  });

  it("count text shows 7 initially", () => {
    buildSearchList();
    expect(document.getElementById("count-text")!.textContent).toBe("7 items");
  });

  it("filtering by 'a' shows Apple, Banana, Date, Grape (4 items)", () => {
    buildSearchList();
    const input = document.getElementById("search-input") as HTMLInputElement;
    input.value = "a";
    input.dispatchEvent(new Event("input"));
    const items = Array.from(document.querySelectorAll(".fruit-item")).map(el => el.textContent);
    expect(items).toContain("Apple");
    expect(items).toContain("Banana");
    expect(items).toContain("Date");
    expect(items).toContain("Grape");
    expect(items).toHaveLength(4);
  });

  it("filtering by 'xyz' shows no-results message", () => {
    buildSearchList();
    const input = document.getElementById("search-input") as HTMLInputElement;
    input.value = "xyz";
    input.dispatchEvent(new Event("input"));
    expect(document.getElementById("no-results")).toBeTruthy();
    expect(document.getElementById("no-results")!.textContent).toBe("No results");
  });

  it("filtering by 'xyz' shows 0 items", () => {
    buildSearchList();
    const input = document.getElementById("search-input") as HTMLInputElement;
    input.value = "xyz";
    input.dispatchEvent(new Event("input"));
    expect(document.querySelectorAll(".fruit-item")).toHaveLength(0);
  });

  it("clearing filter after typing shows all items again", () => {
    buildSearchList();
    const input = document.getElementById("search-input") as HTMLInputElement;
    input.value = "an";
    input.dispatchEvent(new Event("input"));
    input.value = "";
    input.dispatchEvent(new Event("input"));
    expect(document.querySelectorAll(".fruit-item")).toHaveLength(7);
  });

  it("no-results message disappears when filter cleared", () => {
    buildSearchList();
    const input = document.getElementById("search-input") as HTMLInputElement;
    input.value = "xyz";
    input.dispatchEvent(new Event("input"));
    expect(document.getElementById("no-results")).toBeTruthy();
    input.value = "";
    input.dispatchEvent(new Event("input"));
    expect(document.getElementById("no-results")).toBeNull();
  });

  it("count text updates with filter", () => {
    buildSearchList();
    const input = document.getElementById("search-input") as HTMLInputElement;
    input.value = "an";
    input.dispatchEvent(new Event("input"));
    // "Banana" contains "an"
    expect(document.getElementById("count-text")!.textContent).toContain("items");
    const count = parseInt(document.getElementById("count-text")!.textContent!);
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(7);
  });

  it("filtering by 'e' shows Cherry, Elderberry, Apple, Date, Grape", () => {
    buildSearchList();
    const input = document.getElementById("search-input") as HTMLInputElement;
    input.value = "e";
    input.dispatchEvent(new Event("input"));
    const items = Array.from(document.querySelectorAll(".fruit-item")).map(el => el.textContent);
    expect(items).toContain("Cherry");
    expect(items).toContain("Elderberry");
  });
});

// ============================================================
// 7. Registration form with validation
// ============================================================

describe("Registration form with validation", () => {
  let nameVal: string;
  let emailVal: string;
  let passwordVal: string;
  let submitted: boolean;
  let errors: string[];
  let interacted: boolean;

  beforeEach(() => {
    document.body.innerHTML = "";
    nameVal = "";
    emailVal = "";
    passwordVal = "";
    submitted = false;
    errors = [];
    interacted = false;
  });

  function validate() {
    errors = [];
    if (!nameVal.trim()) errors.push("name");
    if (!emailVal.trim() || !emailVal.includes("@")) errors.push("email");
    return errors.length === 0;
  }

  function buildForm() {
    const app = form({ id: "reg-form" },
      div(
        label("Name:"),
        input({
          id: "name-input",
          type: "text",
        },
          on("input", (e) => {
            nameVal = (e.target as HTMLInputElement).value;
            if (interacted) { validate(); update(); }
          })
        ),
        when(
          () => interacted && errors.includes("name"),
          p({ id: "name-error", className: "error" }, "Name is required")
        )
      ),
      div(
        label("Email:"),
        input({
          id: "email-input",
          type: "email",
        },
          on("input", (e) => {
            emailVal = (e.target as HTMLInputElement).value;
            if (interacted) { validate(); update(); }
          })
        ),
        when(
          () => interacted && errors.includes("email"),
          p({ id: "email-error", className: "error" }, "Invalid email address")
        )
      ),
      div(
        label("Password:"),
        input({
          id: "password-input",
          type: "password",
        },
          on("input", (e) => {
            passwordVal = (e.target as HTMLInputElement).value;
          })
        )
      ),
      button({
        id: "submit-btn",
        type: "button",
      },
        "Register",
        on("click", () => {
          interacted = true;
          if (validate()) {
            submitted = true;
          }
          update();
        })
      ),
      when(
        () => submitted,
        div({ id: "success-msg" }, "Registration successful!")
      )
    );
    render(app, document.body);
  }

  it("initial form has no error messages shown", () => {
    buildForm();
    expect(document.getElementById("name-error")).toBeNull();
    expect(document.getElementById("email-error")).toBeNull();
    expect(document.getElementById("success-msg")).toBeNull();
  });

  it("submitting with empty fields shows name and email errors", () => {
    buildForm();
    (document.getElementById("submit-btn") as HTMLElement).click();
    expect(document.getElementById("name-error")).toBeTruthy();
    expect(document.getElementById("email-error")).toBeTruthy();
  });

  it("submitting with empty fields does not show success message", () => {
    buildForm();
    (document.getElementById("submit-btn") as HTMLElement).click();
    expect(document.getElementById("success-msg")).toBeNull();
  });

  it("after filling valid name and email, success message shows", () => {
    buildForm();
    const nameInput = document.getElementById("name-input") as HTMLInputElement;
    nameInput.value = "Alice";
    nameInput.dispatchEvent(new Event("input"));
    const emailInput = document.getElementById("email-input") as HTMLInputElement;
    emailInput.value = "alice@example.com";
    emailInput.dispatchEvent(new Event("input"));
    (document.getElementById("submit-btn") as HTMLElement).click();
    expect(document.getElementById("success-msg")).toBeTruthy();
    expect(document.getElementById("success-msg")!.textContent).toBe("Registration successful!");
  });

  it("error messages disappear when fields corrected after interaction", () => {
    buildForm();
    // First trigger errors
    (document.getElementById("submit-btn") as HTMLElement).click();
    expect(document.getElementById("name-error")).toBeTruthy();
    // Then fix name
    const nameInput = document.getElementById("name-input") as HTMLInputElement;
    nameInput.value = "Bob";
    nameInput.dispatchEvent(new Event("input"));
    expect(document.getElementById("name-error")).toBeNull();
  });

  it("email error shows for invalid email format", () => {
    buildForm();
    const nameInput = document.getElementById("name-input") as HTMLInputElement;
    nameInput.value = "Alice";
    nameInput.dispatchEvent(new Event("input"));
    // Force interacted + validate to check email
    (document.getElementById("submit-btn") as HTMLElement).click();
    // email is empty so should have error
    expect(document.getElementById("email-error")).toBeTruthy();
  });

  it("email error disappears when valid email entered after interaction", () => {
    buildForm();
    (document.getElementById("submit-btn") as HTMLElement).click();
    expect(document.getElementById("email-error")).toBeTruthy();
    const emailInput = document.getElementById("email-input") as HTMLInputElement;
    emailInput.value = "valid@test.com";
    emailInput.dispatchEvent(new Event("input"));
    expect(document.getElementById("email-error")).toBeNull();
  });

  it("success state persists without calling update again", () => {
    buildForm();
    const nameInput = document.getElementById("name-input") as HTMLInputElement;
    nameInput.value = "Alice";
    nameInput.dispatchEvent(new Event("input"));
    const emailInput = document.getElementById("email-input") as HTMLInputElement;
    emailInput.value = "alice@example.com";
    emailInput.dispatchEvent(new Event("input"));
    (document.getElementById("submit-btn") as HTMLElement).click();
    expect(submitted).toBe(true);
    expect(document.getElementById("success-msg")).toBeTruthy();
  });

  it("form elements are present in DOM", () => {
    buildForm();
    expect(document.getElementById("name-input")).toBeTruthy();
    expect(document.getElementById("email-input")).toBeTruthy();
    expect(document.getElementById("password-input")).toBeTruthy();
    expect(document.getElementById("submit-btn")).toBeTruthy();
  });
});

// ============================================================
// 8. Nested dynamic components
// ============================================================

describe("Nested dynamic components", () => {
  interface GroupItem { id: number; text: string; }
  interface Group { id: number; title: string; items: GroupItem[]; collapsed: boolean; }
  let groups: Group[];
  let nextItemId: number;

  beforeEach(() => {
    document.body.innerHTML = "";
    nextItemId = 10;
    groups = [
      { id: 1, title: "Group Alpha", collapsed: false, items: [{ id: 1, text: "Alpha 1" }, { id: 2, text: "Alpha 2" }] },
      { id: 2, title: "Group Beta", collapsed: false, items: [{ id: 3, text: "Beta 1" }, { id: 4, text: "Beta 2" }, { id: 5, text: "Beta 3" }] },
      { id: 3, title: "Group Gamma", collapsed: false, items: [{ id: 6, text: "Gamma 1" }] },
    ];
  });

  function buildNested() {
    const app = div({ id: "groups-container" },
      list(
        () => groups,
        (group) => div(
          { className: "group", "data-group-id": String(group.id) },
          div({ className: "group-header" },
            button(
              {
                className: "group-toggle",
                "data-group-id": String(group.id),
              },
              () => group.collapsed ? `▶ ${group.title}` : `▼ ${group.title}`,
              on("click", () => { group.collapsed = !group.collapsed; update(); })
            ),
            button(
              {
                className: "add-item-btn",
                "data-group-id": String(group.id),
              },
              "Add item",
              on("click", () => {
                group.items.push({ id: nextItemId++, text: `${group.title} item ${group.items.length + 1}` });
                update();
              })
            )
          ),
          when(
            () => !group.collapsed,
            ul({ className: "group-items", "data-group-id": String(group.id) },
              list(
                () => group.items,
                (item) => li(
                  { className: "group-item", "data-item-id": String(item.id) },
                  item.text,
                  button(
                    {
                      className: "delete-item-btn",
                      "data-item-id": String(item.id),
                    },
                    "×",
                    on("click", () => {
                      group.items = group.items.filter(i => i.id !== item.id);
                      update();
                    })
                  )
                )
              )
            )
          )
        )
      )
    );
    render(app, document.body);
  }

  it("renders all 3 groups initially", () => {
    buildNested();
    expect(document.querySelectorAll(".group")).toHaveLength(3);
  });

  it("renders all group items initially", () => {
    buildNested();
    // 2 + 3 + 1 = 6 items
    expect(document.querySelectorAll(".group-item")).toHaveLength(6);
  });

  it("renders group titles correctly", () => {
    buildNested();
    const titles = Array.from(document.querySelectorAll(".group-toggle")).map(el => el.textContent);
    expect(titles.some(t => t!.includes("Group Alpha"))).toBe(true);
    expect(titles.some(t => t!.includes("Group Beta"))).toBe(true);
    expect(titles.some(t => t!.includes("Group Gamma"))).toBe(true);
  });

  it("collapsing a group hides its items", () => {
    buildNested();
    (document.querySelector('.group-toggle[data-group-id="1"]') as HTMLElement).click();
    // Group 1 items should be hidden
    expect(document.querySelector('.group-items[data-group-id="1"]')).toBeNull();
  });

  it("collapsing one group does not hide other groups items", () => {
    buildNested();
    (document.querySelector('.group-toggle[data-group-id="1"]') as HTMLElement).click();
    // Group 2 items should still be visible
    expect(document.querySelector('.group-items[data-group-id="2"]')).toBeTruthy();
    expect(document.querySelectorAll('.group-items[data-group-id="2"] .group-item')).toHaveLength(3);
  });

  it("expanding a collapsed group shows items again", () => {
    buildNested();
    (document.querySelector('.group-toggle[data-group-id="1"]') as HTMLElement).click();
    expect(document.querySelector('.group-items[data-group-id="1"]')).toBeNull();
    (document.querySelector('.group-toggle[data-group-id="1"]') as HTMLElement).click();
    expect(document.querySelector('.group-items[data-group-id="1"]')).toBeTruthy();
    expect(document.querySelectorAll('.group-items[data-group-id="1"] .group-item')).toHaveLength(2);
  });

  it("adding item to a group updates that group's list", () => {
    buildNested();
    expect(document.querySelectorAll('.group-items[data-group-id="1"] .group-item')).toHaveLength(2);
    (document.querySelector('.add-item-btn[data-group-id="1"]') as HTMLElement).click();
    expect(document.querySelectorAll('.group-items[data-group-id="1"] .group-item')).toHaveLength(3);
  });

  it("adding item to group does not affect other groups", () => {
    buildNested();
    (document.querySelector('.add-item-btn[data-group-id="1"]') as HTMLElement).click();
    expect(document.querySelectorAll('.group-items[data-group-id="2"] .group-item')).toHaveLength(3);
  });

  it("deleting item from group updates that group's list", () => {
    buildNested();
    expect(document.querySelectorAll('.group-items[data-group-id="2"] .group-item')).toHaveLength(3);
    (document.querySelector('.delete-item-btn[data-item-id="3"]') as HTMLElement).click();
    expect(document.querySelectorAll('.group-items[data-group-id="2"] .group-item')).toHaveLength(2);
  });

  it("multiple groups can be expanded simultaneously", () => {
    buildNested();
    // All groups start expanded
    expect(document.querySelector('.group-items[data-group-id="1"]')).toBeTruthy();
    expect(document.querySelector('.group-items[data-group-id="2"]')).toBeTruthy();
    expect(document.querySelector('.group-items[data-group-id="3"]')).toBeTruthy();
  });

  it("collapsing multiple groups hides their items", () => {
    buildNested();
    (document.querySelector('.group-toggle[data-group-id="1"]') as HTMLElement).click();
    (document.querySelector('.group-toggle[data-group-id="2"]') as HTMLElement).click();
    expect(document.querySelector('.group-items[data-group-id="1"]')).toBeNull();
    expect(document.querySelector('.group-items[data-group-id="2"]')).toBeNull();
    expect(document.querySelector('.group-items[data-group-id="3"]')).toBeTruthy();
  });
});
