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
  // The hero playground: a patched cell pops into place, a pending cell's dashed ring marches,
  // the update() button rings while mutations wait
  patchPop: keyframes({
    "from": { raw: {"transform": "scale(0.5)", "opacity": "0.3"} },
    "55%": { raw: {"transform": "scale(1.16)", "opacity": "1"} },
    "to": { raw: {"transform": "scale(1)", "opacity": "1"} },
  }),
  dashMarch: keyframes({
    "to": { raw: {"stroke-dashoffset": "-10"} },
  }),
  ringPulse: keyframes({
    "from": { raw: {"box-shadow": "0 0 0 0 var(--c-primary-glow)"} },
    "to": { raw: {"box-shadow": "0 0 0 14px rgba(0,0,0,0)"} },
  }),
  // The hero carousel: an example slides in from the side it was summoned from (--dir: 1 or -1),
  // a new tile or letter pops into place
  slideIn: keyframes({
    "from": { raw: {"opacity": "0", "transform": "translateX(calc(var(--dir, 1) * 40px))"} },
    "to": { raw: {"opacity": "1", "transform": "translateX(0)"} },
  }),
  popIn: keyframes({
    "from": { raw: {"opacity": "0", "transform": "translateY(10px) scale(0.6)"} },
    "60%": { raw: {"opacity": "1", "transform": "translateY(-2px) scale(1.08)"} },
    "to": { raw: {"opacity": "1", "transform": "translateY(0) scale(1)"} },
  }),
} as const;
