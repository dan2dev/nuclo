/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import "../../src";
import { afterEach, describe, it, expect, vi } from "vitest";
import nucloLogo from "../../src/logo";
import { renderToString } from "../../src/ssr";

// The mark, its play triangle and the five letters, each one ink path
const inks = (svg: SVGSVGElement) => [...svg.querySelectorAll("path")];
const finished = (svg: SVGSVGElement) => inks(svg).every((p) => p.getAttribute("fill-opacity") === "1" && p.getAttribute("d")!.endsWith("Z"));

function mount(factory: ReturnType<typeof nucloLogo>) {
  const host = document.body.appendChild(document.createElement("div"));
  render(factory, host);
  return host.querySelector("svg")!;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("nuclo/nuclo-logo", () => {
  it("renders the finished logo, sized and labelled, with extra modifiers on the svg", () => {
    const svg = mount(nucloLogo({ height: 48, animate: false }, { className: "brand" }));
    expect(svg.getAttribute("height")).toBe("48");
    expect(svg.getAttribute("aria-label")).toBe("Nuclo");
    expect(svg.getAttribute("class")).toContain("brand");
    expect(inks(svg)).toHaveLength(7);
    expect(finished(svg)).toBe(true);
  });

  it("starts blank on mount and draws itself frame by frame", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
    const svg = mount(nucloLogo());
    expect(inks(svg).every((p) => p.getAttribute("fill-opacity") === "0")).toBe(true);

    frames.shift()!(performance.now() + 60_000); // long past the end of the drawing
    expect(finished(svg)).toBe(true);
    expect(frames).toHaveLength(0); // and it stops asking for frames
  });

  it("server-renders the finished logo", () => {
    const html = renderToString(nucloLogo());
    expect(html).toContain('aria-label="Nuclo"');
    expect(html).not.toContain('fill-opacity="0"');
  });
});
