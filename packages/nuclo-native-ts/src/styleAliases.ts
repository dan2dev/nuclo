/** nuclo-core's short style keys (`px`, `bg`, `rounded`, `row`, …) and the native Style keys they stand for. */
export const STYLE_ALIASES: Record<string, string[]> = {
  p: ["padding"], px: ["paddingLeft", "paddingRight"], py: ["paddingTop", "paddingBottom"],
  pt: ["paddingTop"], pr: ["paddingRight"], pb: ["paddingBottom"], pl: ["paddingLeft"],
  m: ["margin"], mx: ["marginLeft", "marginRight"], my: ["marginTop", "marginBottom"],
  mt: ["marginTop"], mr: ["marginRight"], mb: ["marginBottom"], ml: ["marginLeft"],
  w: ["width"], h: ["height"], minW: ["minWidth"], maxW: ["maxWidth"], minH: ["minHeight"], maxH: ["maxHeight"],
  size: ["width", "height"], text: ["fontSize"], weight: ["fontWeight"], leading: ["lineHeight"], tracking: ["letterSpacing"],
  align: ["textAlign"], items: ["alignItems"], justify: ["justifyContent"], z: ["zIndex"], bg: ["backgroundColor"], rounded: ["borderRadius"],
};

/** Composite flags (`row: true`): the native keys and values they set. */
export const STYLE_FLAGS: Record<string, [string, string | number][]> = {
  row: [["flexDirection", "row"]],
  col: [["flexDirection", "column"]],
  center: [["alignItems", "center"], ["justifyContent", "center"]],
  truncate: [["numberOfLines", 1]],
};

/** A style with its short keys written as native ones; later keys win, as in a cascade. */
export function expandStyle<S extends object>(style: S): S {
  const keys = Object.keys(style);
  if (!keys.some((key) => key in STYLE_ALIASES || key in STYLE_FLAGS)) return style;
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    const value = (style as Record<string, unknown>)[key];
    if (value == null) continue;
    if (key in STYLE_ALIASES) for (const target of STYLE_ALIASES[key]!) out[target] = value;
    else if (key in STYLE_FLAGS) {
      if (value === true) for (const [target, set] of STYLE_FLAGS[key]!) out[target] = set;
    } else out[key] = value;
  }
  return out as S;
}
