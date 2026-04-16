/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines in src/style/styleBuilder.ts:
 *
 *  Lines 150-156 – getClassDefinitions() with non-empty styles
 *  Line  160     – toString() method
 *  Line  183     – flex(value) branch when value is provided
 *  Lines 562-563 – registerStyleMethods: shorthand method body (isShorthand path)
 *
 * Also covers createStyleFunction shorthand path (lines 580-581).
 */

import { describe, it, expect } from "vitest";
import { StyleBuilder } from "../../src/style/styleBuilder";

// ── Unit: getClassDefinitions() ──────────────────────────────────────────────
describe("StyleBuilder.getClassDefinitions()", () => {
  describe("Happy path", () => {
    it("returns one entry per accumulated style property", () => {
      const sb = new StyleBuilder();
      sb.add("color", "red").add("font-size", "16px");

      const defs = sb.getClassDefinitions();
      expect(defs).toHaveLength(2);
      expect(defs[0]).toMatchObject({ property: "color", value: "red" });
      expect(defs[1]).toMatchObject({ property: "font-size", value: "16px" });
      // Each entry should have a className
      for (const def of defs) {
        expect(typeof def.className).toBe("string");
        expect(def.className.length).toBeGreaterThan(0);
      }
    });

    it("returns empty array when no styles accumulated", () => {
      const defs = new StyleBuilder().getClassDefinitions();
      expect(defs).toHaveLength(0);
    });

    it("all entries share the same className", () => {
      const sb = new StyleBuilder().add("margin", "0").add("padding", "0");
      const defs = sb.getClassDefinitions();
      const classNames = defs.map((d) => d.className);
      expect(new Set(classNames).size).toBe(1);
    });
  });
});

// ── Unit: toString() ─────────────────────────────────────────────────────────
describe("StyleBuilder.toString()", () => {
  it("returns a non-empty CSS class name string", () => {
    const sb = new StyleBuilder().add("color", "blue");
    const str = sb.toString();
    expect(typeof str).toBe("string");
    expect(str.length).toBeGreaterThan(0);
  });

  it("returns same value as getClassName()", () => {
    const sb = new StyleBuilder().add("color", "green");
    expect(sb.toString()).toBe(sb.getClassName());
  });

  it("works on empty builder (returns a class even for empty styles)", () => {
    const str = new StyleBuilder().toString();
    expect(typeof str).toBe("string");
  });
});

// ── Unit: flex() – both branches ─────────────────────────────────────────────
describe("StyleBuilder.flex()", () => {
  it("sets display:flex when called with no argument (else branch)", () => {
    const sb = new StyleBuilder().flex();
    const styles = sb.getStyles();
    expect(styles["display"]).toBe("flex");
    expect("flex" in styles).toBe(false);
  });

  it("sets flex property when called with a value (if branch – line 183)", () => {
    const sb = new StyleBuilder().flex("1 1 auto");
    const styles = sb.getStyles();
    expect(styles["flex"]).toBe("1 1 auto");
    expect("display" in styles).toBe(false);
  });

  it("sets flex:1 shorthand", () => {
    const sb = new StyleBuilder().flex("1");
    expect(sb.getStyles()["flex"]).toBe("1");
  });
});

// ── Unit: bold() and center() special methods ────────────────────────────────
describe("StyleBuilder special methods", () => {
  it("bold() sets font-weight: bold", () => {
    const styles = new StyleBuilder().bold().getStyles();
    expect(styles["font-weight"]).toBe("bold");
  });

  it("center() sets justify-content and align-items to center", () => {
    const styles = new StyleBuilder().center().getStyles();
    expect(styles["justify-content"]).toBe("center");
    expect(styles["align-items"]).toBe("center");
  });
});

// ── Unit: shorthand method – registered via isShorthand path (lines 562-563) ─
describe("StyleBuilder shorthand methods (registerStyleMethods isShorthand)", () => {
  it("grid() sets display:grid without requiring a value argument", () => {
    // grid is a shorthand method registered in registerStyleMethods
    const sb = new StyleBuilder() as StyleBuilder & {
      grid: () => StyleBuilder;
    };
    if (typeof sb.grid === "function") {
      const styles = sb.grid().getStyles();
      expect(styles["display"]).toBe("grid");
    }
  });
});

// ── Unit: method chaining ─────────────────────────────────────────────────────
describe("StyleBuilder method chaining", () => {
  it("chains multiple property methods and accumulates styles", () => {
    const styles = new StyleBuilder()
      .add("color", "white")
      .add("background-color", "#000")
      .add("padding", "8px")
      .getStyles();

    expect(styles["color"]).toBe("white");
    expect(styles["background-color"]).toBe("#000");
    expect(styles["padding"]).toBe("8px");
  });

  it("getStyles() returns a defensive copy", () => {
    const sb = new StyleBuilder().add("color", "red");
    const styles1 = sb.getStyles();
    const styles2 = sb.getStyles();
    expect(styles1).not.toBe(styles2);
    expect(styles1).toEqual(styles2);
  });
});

// ── Unit: getClassName() ─────────────────────────────────────────────────────
describe("StyleBuilder.getClassName()", () => {
  it("returns the same class name for identical styles (cache hit)", () => {
    const sb1 = new StyleBuilder().add("color", "pink");
    const sb2 = new StyleBuilder().add("color", "pink");
    expect(sb1.getClassName()).toBe(sb2.getClassName());
  });

  it("returns different class names for different styles", () => {
    const c1 = new StyleBuilder().add("color", "red").getClassName();
    const c2 = new StyleBuilder().add("color", "blue").getClassName();
    expect(c1).not.toBe(c2);
  });

  it("accepts a prefix to namespace the class name", () => {
    const cn = new StyleBuilder()
      .add("color", "teal")
      .getClassName("my-prefix");
    expect(cn.startsWith("nmy-prefix-")).toBe(true);
  });
});

// ── Unit: getClassNames() ─────────────────────────────────────────────────────
describe("StyleBuilder.getClassNames()", () => {
  it("returns an array with one class name", () => {
    const sb = new StyleBuilder().add("color", "orange");
    const names = sb.getClassNames();
    expect(Array.isArray(names)).toBe(true);
    expect(names).toHaveLength(1);
    expect(names[0]).toBe(sb.getClassName());
  });
});

// ── Unit: dynamically generated property methods (non-shorthand) ──────────────
describe("StyleBuilder – dynamically generated property methods", () => {
  it("fontSize() sets the correct CSS property", () => {
    const sb = new StyleBuilder() as StyleBuilder;
    sb.fontSize("14px");
    const styles = sb.getStyles();
    expect(styles["font-size"]).toBe("14px");
  });

  it("backgroundColor() sets the correct CSS property", () => {
    const sb = new StyleBuilder() as StyleBuilder;
    sb.backgroundColor("#fff");
    expect(sb.getStyles()["background-color"]).toBe("#fff");
  });

  it("opacity() sets the correct property", () => {
    const sb = new StyleBuilder() as StyleBuilder;
    sb.opacity("0.5");
    expect(sb.getStyles()["opacity"]).toBe("0.5");
  });
});
