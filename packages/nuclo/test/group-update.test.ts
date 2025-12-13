/// <reference path="../types/index.d.ts" />

import { describe, it, expect, beforeEach } from "vitest";
import "../src/index";

describe("scope() + update(scopeId)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("updates only the targeted scope subtree", () => {
    let a = 0;
    let b = 0;
    const itemsA: number[] = [1];
    const itemsB: number[] = [10];

    render(
      div(
        div(
          scope("contact-form", "shared"),
          h1({ id: "a-title" }, () => `A:${a}`),
          button({ id: "a-btn", className: () => `a-${a}` }, "A"),
          when(
            () => a > 0,
            div({ id: "a-when" }, "A shown"),
          ).else(div({ id: "a-when" }, "A hidden")),
          list(() => itemsA, (item) => div({ className: "a-item" }, () => `A item ${item} (${a})`)),
        ),
        div(
          scope("other"),
          h1({ id: "b-title" }, () => `B:${b}`),
          button({ id: "b-btn", className: () => `b-${b}` }, "B"),
          when(
            () => b > 0,
            div({ id: "b-when" }, "B shown"),
          ).else(div({ id: "b-when" }, "B hidden")),
          list(() => itemsB, (item) => div({ className: "b-item" }, () => `B item ${item} (${b})`)),
        )
      )
    );

    expect((document.querySelector("#a-title") as HTMLElement).textContent).toBe("A:0");
    expect((document.querySelector("#b-title") as HTMLElement).textContent).toBe("B:0");
    expect((document.querySelector("#a-btn") as HTMLElement).className).toBe("a-0");
    expect((document.querySelector("#b-btn") as HTMLElement).className).toBe("b-0");
    expect((document.querySelector("#a-when") as HTMLElement).textContent).toBe("A hidden");
    expect((document.querySelector("#b-when") as HTMLElement).textContent).toBe("B hidden");
    expect(document.querySelectorAll(".a-item")).toHaveLength(1);
    expect(document.querySelectorAll(".b-item")).toHaveLength(1);
    expect((document.querySelector(".a-item") as HTMLElement).textContent).toBe("A item 1 (0)");
    expect((document.querySelector(".b-item") as HTMLElement).textContent).toBe("B item 10 (0)");

    a = 1;
    b = 1;
    itemsA.push(2);
    itemsB.push(20);

    update("contact-form");

    expect((document.querySelector("#a-title") as HTMLElement).textContent).toBe("A:1");
    expect((document.querySelector("#a-btn") as HTMLElement).className).toBe("a-1");
    expect((document.querySelector("#a-when") as HTMLElement).textContent).toBe("A shown");
    expect(document.querySelectorAll(".a-item")).toHaveLength(2);
    expect((document.querySelectorAll(".a-item")[0] as HTMLElement).textContent).toBe("A item 1 (1)");
    expect((document.querySelectorAll(".a-item")[1] as HTMLElement).textContent).toBe("A item 2 (1)");

    // Unscoped subtree should remain unchanged after update("contact-form")
    expect((document.querySelector("#b-title") as HTMLElement).textContent).toBe("B:0");
    expect((document.querySelector("#b-btn") as HTMLElement).className).toBe("b-0");
    expect((document.querySelector("#b-when") as HTMLElement).textContent).toBe("B hidden");
    expect(document.querySelectorAll(".b-item")).toHaveLength(1);
    expect((document.querySelector(".b-item") as HTMLElement).textContent).toBe("B item 10 (0)");

    update();

    expect((document.querySelector("#b-title") as HTMLElement).textContent).toBe("B:1");
    expect((document.querySelector("#b-btn") as HTMLElement).className).toBe("b-1");
    expect((document.querySelector("#b-when") as HTMLElement).textContent).toBe("B shown");
    expect(document.querySelectorAll(".b-item")).toHaveLength(2);
    expect((document.querySelectorAll(".b-item")[0] as HTMLElement).textContent).toBe("B item 10 (1)");
    expect((document.querySelectorAll(".b-item")[1] as HTMLElement).textContent).toBe("B item 20 (1)");
  });

  it("supports multiple scope ids per element", () => {
    let value = 0;

    render(
      div(
        scope("contact-form", "categories"),
        span({ id: "val" }, () => `v:${value}`)
      )
    );

    value = 1;
    update("categories");
    expect((document.querySelector("#val") as HTMLElement).textContent).toBe("v:1");
  });
});
