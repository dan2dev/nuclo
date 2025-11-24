import "nuclo";
import { colors } from "../styles.ts";

export function NucloLogo(size = 32) {
  return svgSvg(
    {
      width: String(size),
      height: String(size),
      viewBox: "0 0 32 32",
      fill: "none"
    },
    // Outer glow circle
    circleSvg({
      cx: "16",
      cy: "16",
      r: "14",
      stroke: colors.primary,
      "stroke-width": "2",
      fill: "none",
      opacity: "0.3"
    }),
    // Main circle
    circleSvg({
      cx: "16",
      cy: "16",
      r: "12",
      stroke: colors.primary,
      "stroke-width": "2",
      fill: "none"
    }),
    // Inner nucleus with gradient effect
    circleSvg({
      cx: "16",
      cy: "16",
      r: "5",
      fill: colors.primary
    }),
    // Orbital electrons
    circleSvg({
      cx: "16",
      cy: "5",
      r: "2",
      fill: colors.primaryHover
    }),
    circleSvg({
      cx: "24",
      cy: "20",
      r: "2",
      fill: colors.primaryHover
    }),
    circleSvg({
      cx: "8",
      cy: "20",
      r: "2",
      fill: colors.primaryHover
    })
  );
}

export function RocketIcon() {
  return svgSvg(
    {
      width: "28",
      height: "28",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: colors.primary,
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    },
    pathSvg({ d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" }),
    pathSvg({ d: "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" }),
    pathSvg({ d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" }),
    pathSvg({ d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" })
  );
}

export function BoxIcon() {
  return svgSvg(
    {
      width: "28",
      height: "28",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: colors.primary,
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    },
    pathSvg({ d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" }),
    pathSvg({ d: "m3.3 7 8.7 5 8.7-5" }),
    pathSvg({ d: "M12 22V12" })
  );
}

export function ZapIcon() {
  return svgSvg(
    {
      width: "28",
      height: "28",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: colors.primary,
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    },
    pathSvg({ d: "M13 2 3 14h9l-1 8 10-12h-9l1-8z" })
  );
}

export function RefreshIcon() {
  return svgSvg(
    {
      width: "28",
      height: "28",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: colors.primary,
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    },
    pathSvg({ d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
    pathSvg({ d: "M21 3v5h-5" }),
    pathSvg({ d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
    pathSvg({ d: "M8 16H3v5" })
  );
}

export function CodeIcon() {
  return svgSvg(
    {
      width: "28",
      height: "28",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: colors.primary,
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    },
    pathSvg({ d: "m16 18 6-6-6-6" }),
    pathSvg({ d: "m8 6-6 6 6 6" })
  );
}

export function LayersIcon() {
  return svgSvg(
    {
      width: "28",
      height: "28",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: colors.primary,
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    },
    pathSvg({ d: "m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" }),
    pathSvg({ d: "m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" }),
    pathSvg({ d: "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" })
  );
}

export function ArrowRightIcon() {
  return svgSvg(
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    },
    pathSvg({ d: "M5 12h14" }),
    pathSvg({ d: "m12 5 7 7-7 7" })
  );
}

export function CheckIcon() {
  return svgSvg(
    {
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    },
    pathSvg({ d: "M20 6 9 17l-5-5" })
  );
}

export function CopyIcon() {
  return svgSvg(
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    },
    rectSvg({ x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
    pathSvg({ d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
  );
}

export function GitHubIcon() {
  return svgSvg(
    {
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "currentColor"
    },
    pathSvg({
      d: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
    })
  );
}

export function MenuIcon() {
  return svgSvg(
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    },
    lineSvg({ x1: "3", y1: "6", x2: "21", y2: "6" }),
    lineSvg({ x1: "3", y1: "12", x2: "21", y2: "12" }),
    lineSvg({ x1: "3", y1: "18", x2: "21", y2: "18" })
  );
}

export function XIcon() {
  return svgSvg(
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    },
    lineSvg({ x1: "18", y1: "6", x2: "6", y2: "18" }),
    lineSvg({ x1: "6", y1: "6", x2: "18", y2: "18" })
  );
}
