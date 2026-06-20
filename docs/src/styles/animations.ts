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
  softPulse: keyframes({
    "0%, 100%": { raw: {"box-shadow": "0 0 0 rgba(20,184,166,0)"} },
    "50%": { raw: {"box-shadow": "0 0 28px var(--c-primary-glow)"} },
  }),
  progressSweep: keyframes({
    "0%": { raw: {"background-position": "0% 50%"} },
    "100%": { raw: {"background-position": "220% 50%"} },
  }),
  shimmerSweep: keyframes({
    "0%": { raw: {"transform": "translateX(-160%) skewX(-18deg)"} },
    "100%": { raw: {"transform": "translateX(420%) skewX(-18deg)"} },
  }),
  dotPing: keyframes({
    "0%": { raw: {"box-shadow": "0 0 0 0 var(--c-primary-glow)"} },
    "70%": { raw: {"box-shadow": "0 0 0 7px rgba(20,184,166,0)"} },
    "100%": { raw: {"box-shadow": "0 0 0 0 rgba(20,184,166,0)"} },
  }),
  caretBlink: keyframes({
    "0%, 49%": { raw: {"opacity": "1"} },
    "50%, 100%": { raw: {"opacity": "0"} },
  }),
  orbDrift: keyframes({
    "0%, 100%": { raw: {"transform": "translate3d(0, 0, 0) scale(1)"} },
    "50%": { raw: {"transform": "translate3d(0, -16px, 0) scale(1.05)"} },
  }),
  connectorRun: keyframes({
    "0%": { raw: {"background-position": "-80% 0"} },
    "100%": { raw: {"background-position": "180% 0"} },
  }),
  connectorRunY: keyframes({
    "0%": { raw: {"background-position": "0 -80%"} },
    "100%": { raw: {"background-position": "0 180%"} },
  }),
  spin: keyframes({
    "to": { raw: {"transform": "rotate(360deg)"} },
  }),
  pulse: keyframes({
    "0%,100%": { raw: {"opacity": "1"} },
    "50%": { raw: {"opacity": "0.4"} },
  }),
} as const;
