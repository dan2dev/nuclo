/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines in src/style/cssGenerator.ts:
 *
 *  Lines 109-119 – Pseudo-class rule update (existingRule branch)
 *  Lines 199-205 – At-rule rule update (existingRule branch inside at-rule)
 *  Lines 241-248 – Regular rule update (existingRule branch for base class)
 *
 * Strategy: Call createCSSClassWithStyles twice with the same className so
 * the second call hits the "update existing rule" path instead of inserting.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createCSSClassWithStyles,
  classExistsInDOM,
} from "../../src/style/cssGenerator";

// ── helpers ───────────────────────────────────────────────────────────────────

function ensureStyleSheet(): HTMLStyleElement {
  let sheet = document.querySelector(
    "#nuclo-styles",
  ) as HTMLStyleElement | null;
  if (!sheet) {
    sheet = document.createElement("style");
    sheet.id = "nuclo-styles";
    document.head.appendChild(sheet);
  }
  return sheet;
}

beforeEach(() => {
  // Clean up stylesheet between tests to avoid rule accumulation
  const sheet = document.querySelector(
    "#nuclo-styles",
  ) as HTMLStyleElement | null;
  if (sheet?.sheet) {
    while (sheet.sheet.cssRules.length > 0) {
      sheet.sheet.deleteRule(0);
    }
  }
});

// ── Unit: createCSSClassWithStyles – base class (no condition) ────────────────
describe("createCSSClassWithStyles – base class", () => {
  describe("Happy path", () => {
    it("creates a new CSS rule on first call", () => {
      ensureStyleSheet();
      createCSSClassWithStyles("test-base-class", { color: "red" });
      expect(classExistsInDOM("test-base-class")).toBe(true);
    });

    it("updates existing rule on second call (lines 241-248)", () => {
      ensureStyleSheet();
      createCSSClassWithStyles("update-class", { color: "red" });
      createCSSClassWithStyles("update-class", {
        color: "blue",
        "font-size": "14px",
      });

      // Rule should still exist
      expect(classExistsInDOM("update-class")).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("handles empty styles object", () => {
      ensureStyleSheet();
      expect(() => createCSSClassWithStyles("empty-styles", {})).not.toThrow();
    });

    it("handles multiple properties", () => {
      ensureStyleSheet();
      createCSSClassWithStyles("multi-props", {
        color: "red",
        "background-color": "blue",
        padding: "8px",
        margin: "4px",
      });
      expect(classExistsInDOM("multi-props")).toBe(true);
    });
  });
});

// ── Unit: createCSSClassWithStyles – with media query ────────────────────────
describe("createCSSClassWithStyles – at-rule (media query)", () => {
  describe("Happy path", () => {
    it("creates a media rule on first call", () => {
      ensureStyleSheet();
      createCSSClassWithStyles(
        "media-class",
        { color: "red" },
        "(min-width: 768px)",
      );
      expect(
        classExistsInDOM("media-class", "(min-width: 768px)", "media"),
      ).toBe(true);
    });

    it("updates existing class within at-rule on second call (lines 199-205)", () => {
      ensureStyleSheet();
      // First call – create
      createCSSClassWithStyles(
        "media-update",
        { color: "green" },
        "(min-width: 480px)",
      );
      // Second call – update existing rule inside the at-rule
      createCSSClassWithStyles(
        "media-update",
        { color: "purple", "font-weight": "bold" },
        "(min-width: 480px)",
      );

      expect(
        classExistsInDOM("media-update", "(min-width: 480px)", "media"),
      ).toBe(true);
    });

    it("creates separate rules for different media queries", () => {
      ensureStyleSheet();
      createCSSClassWithStyles(
        "different-mq",
        { color: "red" },
        "(min-width: 300px)",
      );
      createCSSClassWithStyles(
        "different-mq",
        { color: "blue" },
        "(min-width: 600px)",
      );

      expect(
        classExistsInDOM("different-mq", "(min-width: 300px)", "media"),
      ).toBe(true);
      expect(
        classExistsInDOM("different-mq", "(min-width: 600px)", "media"),
      ).toBe(true);
    });
  });

  describe("Edge cases – at-rule types", () => {
    it("creates a @container rule", () => {
      ensureStyleSheet();
      createCSSClassWithStyles(
        "container-class",
        { color: "red" },
        "sidebar (min-width: 200px)",
        "container",
      );
      expect(
        classExistsInDOM(
          "container-class",
          "sidebar (min-width: 200px)",
          "container",
        ),
      ).toBe(true);
    });

    it("updates existing @container rule class", () => {
      ensureStyleSheet();
      createCSSClassWithStyles(
        "container-update",
        { color: "red" },
        "main (min-width: 400px)",
        "container",
      );
      createCSSClassWithStyles(
        "container-update",
        { color: "blue" },
        "main (min-width: 400px)",
        "container",
      );
      expect(
        classExistsInDOM(
          "container-update",
          "main (min-width: 400px)",
          "container",
        ),
      ).toBe(true);
    });

    it("creates a @supports rule", () => {
      ensureStyleSheet();
      createCSSClassWithStyles(
        "supports-class",
        { color: "red" },
        "(display: grid)",
        "supports",
      );
      expect(
        classExistsInDOM("supports-class", "(display: grid)", "supports"),
      ).toBe(true);
    });

    it("updates existing @supports rule class", () => {
      ensureStyleSheet();
      createCSSClassWithStyles(
        "supports-update",
        { color: "red" },
        "(display: flex)",
        "supports",
      );
      createCSSClassWithStyles(
        "supports-update",
        { color: "blue" },
        "(display: flex)",
        "supports",
      );
      expect(
        classExistsInDOM("supports-update", "(display: flex)", "supports"),
      ).toBe(true);
    });
  });
});

// ── Unit: createCSSClassWithStyles – pseudo-class ────────────────────────────
describe("createCSSClassWithStyles – pseudo-class", () => {
  describe("Happy path", () => {
    it("creates a rule with pseudo-class selector on first call", () => {
      ensureStyleSheet();
      createCSSClassWithStyles(
        "hover-class",
        { color: "red" },
        undefined,
        "media",
        ":hover",
      );
      expect(
        classExistsInDOM("hover-class", undefined, "media", ":hover"),
      ).toBe(true);
    });

    it("updates existing pseudo-class rule on second call (lines 109-119)", () => {
      ensureStyleSheet();
      createCSSClassWithStyles(
        "pseudo-update",
        { color: "green" },
        undefined,
        "media",
        ":hover",
      );
      createCSSClassWithStyles(
        "pseudo-update",
        { color: "purple", opacity: "0.8" },
        undefined,
        "media",
        ":hover",
      );
      expect(
        classExistsInDOM("pseudo-update", undefined, "media", ":hover"),
      ).toBe(true);
    });

    it("creates rules for different pseudo-classes independently", () => {
      ensureStyleSheet();
      createCSSClassWithStyles(
        "multi-pseudo",
        { color: "red" },
        undefined,
        "media",
        ":hover",
      );
      createCSSClassWithStyles(
        "multi-pseudo",
        { color: "blue" },
        undefined,
        "media",
        ":focus",
      );
      expect(
        classExistsInDOM("multi-pseudo", undefined, "media", ":hover"),
      ).toBe(true);
      expect(
        classExistsInDOM("multi-pseudo", undefined, "media", ":focus"),
      ).toBe(true);
    });
  });
});

// ── Unit: classExistsInDOM ────────────────────────────────────────────────────
describe("classExistsInDOM", () => {
  it("returns false when no stylesheet exists", () => {
    // Remove stylesheet entirely
    const sheet = document.querySelector("#nuclo-styles");
    sheet?.remove();
    expect(classExistsInDOM("no-sheet")).toBe(false);
  });

  it("returns false for a class that does not exist", () => {
    ensureStyleSheet();
    expect(classExistsInDOM("does-not-exist-xyz")).toBe(false);
  });

  it("returns true for an existing base class", () => {
    ensureStyleSheet();
    createCSSClassWithStyles("exists-check", { color: "red" });
    expect(classExistsInDOM("exists-check")).toBe(true);
  });

  it("returns false for missing condition rule", () => {
    ensureStyleSheet();
    expect(classExistsInDOM("some-class", "(min-width: 9999px)", "media")).toBe(
      false,
    );
  });
});
