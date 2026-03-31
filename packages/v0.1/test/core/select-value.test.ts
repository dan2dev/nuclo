/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from "vitest";
import "../../src/index.js";

/** Helper: invoke the factory returned by select() to get the actual HTMLSelectElement. */
function mount(factory: ReturnType<typeof select>): HTMLSelectElement {
  const el = (factory as any)(document.body, 0) as HTMLSelectElement;
  document.body.appendChild(el);
  return el;
}

describe("select element value binding", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should apply static value after options are present", () => {
    const el = mount(
      select(
        { value: "B" },
        option({ value: "A" }, "Alpha"),
        option({ value: "B" }, "Bravo"),
        option({ value: "C" }, "Charlie")
      )
    );

    expect(el.value).toBe("B");
  });

  it("should apply reactive value after options are present", () => {
    let current = "B";
    const el = mount(
      select(
        { value: () => current },
        option({ value: "A" }, "Alpha"),
        option({ value: "B" }, "Bravo"),
        option({ value: "C" }, "Charlie")
      )
    );

    expect(el.value).toBe("B");
  });

  it("should apply reactive value declared before options", () => {
    let selectedRole = "all";
    const el = mount(
      select(
        { value: () => selectedRole },
        on("change", (e) => {
          selectedRole = (e.target as HTMLSelectElement).value;
          update();
        }),
        option({ value: "---" }, "---"),
        option({ value: "Admin" }, "Admins"),
        option({ value: "all" }, "All Roles"),
        option({ value: "User" }, "Users")
      )
    );

    // Should reflect the initial value, not default to first option
    expect(el.value).toBe("all");
  });

  it("should update select value reactively on state change", () => {
    let selectedRole = "all";
    const el = mount(
      select(
        { value: () => selectedRole },
        on("change", (e) => {
          selectedRole = (e.target as HTMLSelectElement).value;
          update();
        }),
        option({ value: "---" }, "---"),
        option({ value: "Admin" }, "Admins"),
        option({ value: "all" }, "All Roles"),
        option({ value: "User" }, "Users")
      )
    );

    expect(el.value).toBe("all");

    // Simulate state change
    selectedRole = "Admin";
    update();
    expect(el.value).toBe("Admin");

    selectedRole = "User";
    update();
    expect(el.value).toBe("User");
  });

  it("should preserve select value after re-rendering (page navigation simulation)", () => {
    let selectedRole = "Admin";

    function createSelectFactory() {
      return select(
        { value: () => selectedRole },
        option({ value: "---" }, "---"),
        option({ value: "Admin" }, "Admins"),
        option({ value: "all" }, "All Roles"),
        option({ value: "User" }, "Users")
      );
    }

    // First render
    const el1 = mount(createSelectFactory());
    expect(el1.value).toBe("Admin");

    // Simulate navigating away
    document.body.innerHTML = "";

    // Simulate returning - creates new DOM elements but selectedRole is preserved
    const el2 = mount(createSelectFactory());
    expect(el2.value).toBe("Admin");
  });

  it("should apply static value declared before options", () => {
    const el = mount(
      select(
        { value: "all" },
        option({ value: "---" }, "---"),
        option({ value: "Admin" }, "Admins"),
        option({ value: "all" }, "All Roles"),
        option({ value: "User" }, "Users")
      )
    );

    expect(el.value).toBe("all");
  });
});
