/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createReactiveTextNode, notifyReactiveTextNodes } from "../../src/update/reactive-text";
import { registerAttributeResolver, notifyReactiveElements } from "../../src/update/reactive-attributes";
import { reactiveElementsByNode } from "../../src/update/registry";

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
      const node = createReactiveTextNode(resolver, resolver());
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
      const node = createReactiveTextNode(resolver, resolver());
      expect(node.textContent).toBe("42");
    });

    it("should handle boolean values", () => {
      const resolver = () => true;
      const node = createReactiveTextNode(resolver, resolver());
      expect(node.textContent).toBe("true");
    });

    it("renders nullish and non-primitive values as empty text", () => {
      for (const value of [null, undefined, { a: 1 }, [1, 2], () => "fn"]) {
        const node = createReactiveTextNode(() => value, value);
        expect(node.textContent).toBe("");
      }
    });

    it("should update text content when resolver changes", () => {
      let value = "initial";
      const resolver = () => value;
      const node = createReactiveTextNode(resolver, resolver());
      expect(node.textContent).toBe("initial");

      // Node needs to be connected to DOM for updates to work
      container.appendChild(node);
      
      value = "updated";
      notifyReactiveTextNodes();
      expect(node.textContent).toBe("updated");
    });

    it("logs and clears text when resolver throws during updates", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const resolver = () => {
        throw new Error("update error");
      };

      const node = createReactiveTextNode(resolver, "ok");
      expect(node).toBeInstanceOf(Text);

      container.appendChild(node as Text);
      notifyReactiveTextNodes();

      expect((node as Text).textContent).toBe("");
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
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
        (_el, _key, value) => {
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
        (_el, _key, value) => {
          element.className = String(value);
        }
      );

      registerAttributeResolver(
        element,
        "disabled",
        () => disabled,
        (_el, _key, value) => {
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
        (_el, _key, value) => {
          element.className = String(value);
        }
      );

      notifyReactiveElements();
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("re-registering a key replaces its resolver and leaves the other keys alone", () => {
      let a = "a1";
      let b = "b1";
      const seen: string[] = [];
      const apply = (el: Element, key: string, value: unknown) => {
        seen.push(`${key}=${String(value)}`);
        el.setAttribute(key, String(value));
      };
      registerAttributeResolver(element, "data-a", () => a, apply);
      registerAttributeResolver(element, "data-b", () => b, apply);
      registerAttributeResolver(element, "data-a", () => "replaced", apply);
      expect(element.getAttribute("data-a")).toBe("replaced");
      expect(reactiveElementsByNode.get(element)!.attributeResolvers.map((r) => r.key)).toEqual(["data-a", "data-b"]);

      a = "a2";
      b = "b2";
      seen.length = 0;
      notifyReactiveElements();
      expect(seen).toEqual(["data-b=b2"]); // data-a's value is unchanged → not re-applied
      expect(element.getAttribute("data-a")).toBe("replaced");
    });

    it("should clean up disconnected elements", () => {
      let value = "test";
      registerAttributeResolver(
        element,
        "class",
        () => value,
        (_el, _key, value) => {
          element.className = String(value);
        }
      );

      container.removeChild(element);
      value = "updated";
      notifyReactiveElements();

      // Element should be cleaned up, so no update should occur
      expect(element.className).toBe("test");
    });
  });
});



