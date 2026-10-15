import 'nuclo';

export const animations = {
  pageFadeIn: keyframes({
    "from": { raw: {"opacity": "0", "transform": "translateY(8px)"} },
    "to": { raw: {"opacity": "1", "transform": "translateY(0)"} },
  }),
  riseIn: keyframes({
    "from": { raw: {"opacity": "0", "transform": "translateY(18px)"} },
    "to": { raw: {"opacity": "1", "transform": "translateY(0)"} },
  }),
  heroIn: keyframes({
    "from": { raw: {"opacity": "0", "transform": "translateY(22px)"} },
    "to": { raw: {"opacity": "1", "transform": "translateY(0)"} },
  }),
  caretBlink: keyframes({
    "0%, 49%": { raw: {"opacity": "1"} },
    "50%, 100%": { raw: {"opacity": "0"} },
  }),
  spin: keyframes({
    "to": { raw: {"transform": "rotate(360deg)"} },
  }),
  // The brand's motion: a pen draws a line, the ink fills in, the guide fades. Used by the header's menu
  draw: keyframes({ // a line drawn from its origin
    "from": { raw: {"transform": "scaleX(0)"} },
    "to": { raw: {"transform": "scaleX(1)"} },
  }),
  ink: keyframes({
    "from": { raw: {"opacity": "0"} },
    "to": { raw: {"opacity": "1"} },
  }),
  strokeDraw: keyframes({ // an icon's stroke drawn end to end (pathLength="1")
    "from": { raw: {"stroke-dashoffset": "1"} },
    "to": { raw: {"stroke-dashoffset": "0"} },
  }),
  pulse: keyframes({
    "0%,100%": { raw: {"opacity": "1"} },
    "50%": { raw: {"opacity": "0.4"} },
  }),
} as const;
