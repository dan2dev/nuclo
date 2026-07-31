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
  caretBlink: keyframes({
    "0%, 49%": { raw: {"opacity": "1"} },
    "50%, 100%": { raw: {"opacity": "0"} },
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
