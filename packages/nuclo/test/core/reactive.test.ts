import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createReactiveTextNode,
  notifyReactiveTextNodes,
  registerAttributeResolver,
  notifyReactiveElements,
} from "../../src/core/reactive";

describe("reactive module exports", () => {
  it("should export createReactiveTextNode", () => {
    expect(typeof createReactiveTextNode).toBe("function");
  });

  it("should export notifyReactiveTextNodes", () => {
    expect(typeof notifyReactiveTextNodes).toBe("function");
  });

  it("should export registerAttributeResolver", () => {
    expect(typeof registerAttributeResolver).toBe("function");
  });

  it("should export notifyReactiveElements", () => {
    expect(typeof notifyReactiveElements).toBe("function");
  });

  describe("createReactiveTextNode", () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    afterEach(() => {
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    });

    it("should create a reactive text node", () => {
      const resolver = () => "test";
      const node = createReactiveTextNode(resolver);
      expect(node).toBeInstanceOf(Text);
      expect(node.textContent).toBe("test");
    });

    it("should handle pre-evaluated values", () => {
      const resolver = () => "pre-evaluated";
      const node = createReactiveTextNode(resolver, "pre-evaluated");
      expect(node.textContent).toBe("pre-evaluated");
    });

    it("should handle number values", () => {
      const resolver = () => 42;
      const node = createReactiveTextNode(resolver);
      expect(node.textContent).toBe("42");
    });

    it("should handle boolean values", () => {
      const resolver = () => true;
      const node = createReactiveTextNode(resolver);
      expect(node.textContent).toBe("true");
    });

    it("should handle null values", () => {
      const resolver = () => null;
      const node = createReactiveTextNode(resolver);
      // String(null) returns "null", not empty string
      expect(node.textContent).toBe("null");
    });

    it("should handle undefined values", () => {
      const resolver = () => undefined;
      const node = createReactiveTextNode(resolver);
      expect(node.textContent).toBe("");
    });

    it("should handle throwing resolvers gracefully", () => {
      const resolver = () => {
        throw new Error("test error");
      };
      const node = createReactiveTextNode(resolver);
      expect(node.textContent).toBe("");
    });

    it("should update text content when resolver changes", () => {
      let value = "initial";
      const resolver = () => value;
      const node = createReactiveTextNode(resolver);
      expect(node.textContent).toBe("initial");

      // Node needs to be connected to DOM for updates to work
      container.appendChild(node);
      
      value = "updated";
      notifyReactiveTextNodes();
      expect(node.textContent).toBe("updated");
    });
  });

  describe("registerAttributeResolver and notifyReactiveElements", () => {
    let container: HTMLElement;
    let element: HTMLElement;

    beforeEach(() => {
      container = document.createElement("div");
      element = document.createElement("div");
      container.appendChild(element);
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it("should register and apply attribute resolver", () => {
      let className = "initial";
      registerAttributeResolver(
        element,
        "class",
        () => className,
        (value) => {
          element.className = String(value);
        }
      );

      expect(element.className).toBe("initial");

      className = "updated";
      notifyReactiveElements();
      expect(element.className).toBe("updated");
    });

    it("should handle multiple attribute resolvers", () => {
      let className = "test";
      let disabled = false;

      registerAttributeResolver(
        element,
        "class",
        () => className,
        (value) => {
          element.className = String(value);
        }
      );

      registerAttributeResolver(
        element,
        "disabled",
        () => disabled,
        (value) => {
          (element as HTMLButtonElement).disabled = Boolean(value);
        }
      );

      expect(element.className).toBe("test");
      expect((element as HTMLButtonElement).disabled).toBe(false);

      className = "updated";
      disabled = true;
      notifyReactiveElements();

      expect(element.className).toBe("updated");
      expect((element as HTMLButtonElement).disabled).toBe(true);
    });

    it("should handle throwing resolvers gracefully", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      registerAttributeResolver(
        element,
        "class",
        () => {
          throw new Error("resolver error");
        },
        (value) => {
          element.className = String(value);
        }
      );

      notifyReactiveElements();
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should clean up disconnected elements", () => {
      let value = "test";
      registerAttributeResolver(
        element,
        "class",
        () => value,
        (value) => {
          element.className = String(value);
        }
      );

      container.removeChild(element);
      value = "updated";
      notifyReactiveElements();

      // Element should be cleaned up, so no update should occur
      expect(element.className).toBe("test");
    });

    it("should handle invalid parameters gracefully", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      // Testing invalid input - these should be caught by type guards
      registerAttributeResolver(null as any, "class", () => "test", () => {});
      registerAttributeResolver(element, "", () => "test", () => {});
      registerAttributeResolver(element, "class", null as any, () => {});

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});




