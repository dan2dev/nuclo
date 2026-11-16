// nuclo-core style objects read as native Style keys (src/styleAliases.ts): what the compiler and the web runtime share.
import { describe, expect, test } from "bun:test";
import { StyleError, lowerEntry, normalizeStyle, parseAnimation, registerKeyframes, keyframesNamed } from "../src/styleAliases.ts";

const theme = { colors: { line: "#e5e7eb", brand: "#7c3aed" }, radii: { card: "16px" }, shadows: { card: "0 4px 12px rgba(0, 0, 0, 0.1)" }, screens: { md: "(min-width: 600px)" } };

describe("lowerEntry", () => {
  test("lengths, tokens and shorthands", () => {
    expect(lowerEntry("p", "12px")).toEqual([["padding", 12]]);
    expect(lowerEntry("mx", "1rem")).toEqual([["marginLeft", 16], ["marginRight", 16]]);
    expect(lowerEntry("borderBottom", "1px solid line", theme)).toEqual([["borderBottomWidth", 1], ["borderBottomColor", "#e5e7eb"]]);
    expect(lowerEntry("border", "none")).toEqual([["borderWidth", 0]]);
    expect(lowerEntry("rounded", "card", theme)).toEqual([["borderRadius", 16]]);
    expect(lowerEntry("shadow", "card", theme)).toEqual([["shadowOffsetX", 0], ["shadowOffsetY", 4], ["shadowRadius", 12], ["shadowColor", "rgba(0, 0, 0, 0.1)"]]);
    expect(lowerEntry("transform", "translate(4px, -2px) rotate(0.25turn) scale(1.1)")).toEqual([["translateX", 4], ["translateY", -2], ["rotate", 90], ["scale", 1.1]]);
    expect(lowerEntry("transition", "opacity 200ms ease-out 50ms")).toEqual([["transitionEasing", "ease-out"], ["transitionDuration", 200], ["transitionDelay", 50]]);
    expect(lowerEntry("width", "50%")).toEqual([["widthPct", 50]]);
    expect(lowerEntry("fontWeight", 600)).toEqual([["fontWeight", "semibold"]]);
    expect(lowerEntry("flex", "1 1 0%")).toEqual([["flex", 1]]);
    expect(lowerEntry("aspectRatio", "16 / 9")).toEqual([["aspectRatio", 16 / 9]]);
    expect(lowerEntry("cursor", "pointer")).toEqual([]);
  });

  test("what has no native equivalent is reported", () => {
    expect(() => lowerEntry("height", "50%")).toThrow(StyleError);
    expect(() => lowerEntry("position", "fixed")).toThrow(StyleError);
    expect(() => lowerEntry("transform", "skewX(10deg)")).toThrow(StyleError);
  });
});

describe("normalizeStyle", () => {
  test("states, selectors, media, raw and the cascade within one object", () => {
    const s = normalizeStyle(
      { px: 8, p: 4, hover: { bg: "brand" }, "&:nth-child(odd)": { opacity: 0.5 }, md: { p: 24 }, "@media (max-width: 400px)": { p: 2 }, raw: { "border-top": "2px solid red" }, placeholder: { color: "line" } },
      theme,
    );
    expect(s.padding).toBe(4);
    expect(s.paddingLeft).toBeUndefined(); // `p` after `px` resets the sides, as in CSS
    expect(s.hover).toEqual({ backgroundColor: "#7c3aed" });
    expect(s.odd).toEqual({ opacity: 0.5 });
    expect(s.media).toEqual([{ min: 600, style: { padding: 24 } }, { max: 400, style: { padding: 2 } }]);
    expect(s.borderTopWidth).toBe(2);
    expect(s.placeholderColor).toBe("#e5e7eb");
  });

  test("animation over keyframes()", () => {
    const name = registerKeyframes({ from: { opacity: 0 }, "50%": { opacity: 1 }, to: { opacity: 0 } });
    const anim = parseAnimation(`${name} 1.2s ease-in-out 100ms infinite alternate`, keyframesNamed);
    expect(anim).toMatchObject({ name, duration: 1200, delay: 100, easing: "ease-in-out", iterations: -1, alternate: true });
    expect(anim.frames.map((f) => f.at)).toEqual([0, 0.5, 1]);
  });
});
