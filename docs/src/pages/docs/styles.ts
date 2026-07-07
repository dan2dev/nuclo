import { css, colors } from "../../styles.ts";
import { animations } from "../../styles/animations.ts";

const mono = "'JetBrains Mono', monospace";

const contentTypography = {
  "& h1": { raw: { "font-size": "2.85rem", "font-weight": "800", "margin-bottom": "14px", "line-height": "1.06", "letter-spacing": "0" } },
  "& h2": { raw: { "font-size": "1.58rem", "font-weight": "800", margin: "0", "line-height": "1.24", "letter-spacing": "0" } },
  "& h3": { raw: { "font-size": "1.05rem", "font-weight": "700", "margin-top": "32px", "margin-bottom": "10px", "scroll-margin-top": "80px" } },
  "& p": { raw: { "font-size": "0.9375rem", color: "var(--c-text-dim)", "line-height": "1.75", "margin-bottom": "18px" } },
  "& ul": { raw: { margin: "0 0 18px 0", "padding-left": "20px", color: "var(--c-text-dim)", "font-size": "0.9375rem" } },
  "& ol": { raw: { margin: "0 0 18px 0", "padding-left": "20px", color: "var(--c-text-dim)", "font-size": "0.9375rem" } },
  "& li": { raw: { "margin-bottom": "6px", "line-height": "1.7" } },
  "& li::marker": { raw: { color: "var(--c-primary)" } },
  "& code": { raw: { "font-family": mono, "font-size": "0.82em", "background-color": "var(--c-bg-secondary)", padding: "2px 6px", "border-radius": "4px", color: "var(--c-primary-hover)" } },
  "& pre": { raw: { "max-width": "100%", "overflow-x": "auto" } },
  "& .kw": { raw: { color: "var(--c-tok-keyword)" } },
  "& .st": { raw: { color: "var(--c-tok-string)" } },
  "& .fn": { raw: { color: "var(--c-tok-fn)" } },
  "& .cm": { raw: { color: "var(--c-tok-comment)", "font-style": "italic" } },
  "& .nm": { raw: { color: "var(--c-tok-number)" } },
  "& .ty": { raw: { color: "var(--c-tok-type)" } },
  "& .pt": { raw: { color: "var(--c-tok-punct)" } },
  "& .pr": { raw: { color: "var(--c-tok-prop)" } },
  "& .code-block-frame": { raw: { margin: "22px 0", "background-color": "var(--c-bg-code)", border: "1px solid var(--c-border)", "border-radius": "8px", overflow: "hidden", "box-shadow": "inset 0 1px 0 rgba(255,255,255,0.04)", "max-width": "100%" } },
  "& .code-block-header": { raw: { display: "flex", "align-items": "center", "justify-content": "space-between", "min-height": "38px", padding: "9px 16px", "background-color": "var(--c-bg-secondary)", "border-bottom": "1px solid var(--c-border)" } },
  "& .code-block-filename": { raw: { "font-family": mono, "font-size": "0.75rem", color: "var(--c-text-muted)" } },
  "& .code-block-body": { raw: { padding: "18px 20px 20px", "overflow-x": "auto", color: "var(--c-text)", "font-family": mono, "font-size": "0.8rem", "line-height": "1.7", "scrollbar-width": "thin" } },
  "& .code-block-body pre": { raw: { margin: "0", "white-space": "pre", "min-width": "max-content" } },
  "& .docs-callout": { raw: { "background-color": "var(--c-primary-alpha-08)", border: "1px solid var(--c-border-primary)", "border-left": "3px solid var(--c-primary)", "border-radius": "8px", padding: "16px 18px", margin: "20px 0", "font-size": "0.9rem", color: "var(--c-text-dim)", animation: `${animations.softPulse} 4.2s ease-in-out infinite` } },
  "& .docs-callout strong": { raw: { color: "var(--c-primary)" } },
} as const;

export const ds = {
  layout: css({ display: "grid", gridTemplateColumns: "228px minmax(0, 840px) 184px", gap: "34px", maxWidth: "1336px", margin: "0 auto", padding: "0 28px", minHeight: "100vh", alignItems: "start", raw: { "scrollbar-width": "thin" }, "@media (max-width: 1180px)": { gridTemplateColumns: "224px minmax(0, 1fr)", maxWidth: "1080px", gap: "42px" }, "@media (max-width: 900px)": { display: "block", padding: "0 24px" }, "@media (max-width: 600px)": { padding: "0 18px" } }),
  progress: css({ position: "fixed", top: "76px", left: "0", right: "0", zIndex: 190, height: "2px", pointerEvents: "none", backgroundColor: "transparent" }),
  progressFill: css({ width: "var(--docs-progress)", height: "100%", backgroundImage: "linear-gradient(90deg, var(--c-accent-warm), var(--c-primary), var(--c-accent-secondary), var(--c-primary))", backgroundSize: "220% 100%", animation: `${animations.progressSweep} 3s linear infinite`, transition: "width 0.08s linear" }),

  sidebar: css({ padding: "8px 0 44px", position: "sticky", top: "96px", height: "calc(100vh - 112px)", overflowY: "auto", alignSelf: "start", "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-track": { backgroundColor: "transparent" }, "&::-webkit-scrollbar-thumb": { backgroundColor: colors.borderLight, borderRadius: "2px" }, "@media (max-width: 900px)": { display: "none" } }),
  sidebarHead: css({ margin: "0 0 22px", padding: "0 0 18px", borderBottom: `1px solid ${colors.border}` }),
  sidebarKicker: css({ fontFamily: mono, fontSize: "0.68rem", letterSpacing: "0", textTransform: "uppercase", color: colors.primary, marginBottom: "4px", fontWeight: "800" }),
  sidebarTitle: css({ fontSize: "1.05rem", fontWeight: "800", color: colors.text }),
  sidebarGroup: css({ marginBottom: "26px" }),
  sidebarGroupTitle: css({ fontSize: "0.7rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.textMuted, marginBottom: "8px" }),
  sidebarLink: css({ display: "block", fontSize: "0.86rem", color: colors.textDim, padding: "8px 10px 8px 12px", borderLeft: "2px solid transparent", borderRadius: "0 8px 8px 0", transition: "all 0.18s ease", cursor: "pointer", hover: { color: colors.text, backgroundColor: colors.bgSecondary } }),
  sidebarLinkActive: css({ color: colors.primary, backgroundColor: colors.primaryAlpha08, borderLeftColor: colors.primary, fontWeight: "800", hover: { color: colors.primary, backgroundColor: colors.primaryAlpha08 } }),

  content: css({ padding: "0 0 76px", maxWidth: "820px", width: "100%", minWidth: "0", overflowX: "hidden", ...contentTypography, "@media (max-width: 1180px)": { maxWidth: "100%" }, "@media (max-width: 900px)": { padding: "0 0 60px", maxWidth: "100%" }, "@media (max-width: 600px)": { "& h1": { raw: { "font-size": "2rem" } }, "& h2": { raw: { "font-size": "1.28rem" } } } }),
  hero: css({ position: "relative", animation: `${animations.riseIn} 0.58s cubic-bezier(0.22, 1, 0.36, 1) both`, padding: "6px 0 38px", marginBottom: "2px", borderBottom: `1px solid ${colors.border}`, "@media (max-width: 600px)": { paddingBottom: "28px" } }),
  heroShell: css({ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 170px", alignItems: "center", gap: "28px", "@media (max-width: 700px)": { display: "block" } }),
  heroCopy: css({ minWidth: "0" }),
  heroMarkWrap: css({ display: "flex", justifyContent: "flex-end", "@media (max-width: 700px)": { display: "none" } }),
  heroMark: css({ width: "138px", height: "138px", transform: "rotate(7deg)", filter: "drop-shadow(0 24px 30px rgba(255,63,0,0.22))" }),
  eyebrow: css({ fontFamily: mono, fontSize: "0.72rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.primary, marginBottom: "12px" }),
  lead: css({ fontSize: "1.05rem", color: colors.textDim, lineHeight: "1.75", maxWidth: "720px", marginBottom: "0" }),
  quickstart: css({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "18px", marginTop: "24px", padding: "13px 14px 13px 16px", backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease", boxShadow: "0 18px 42px -34px rgba(0,0,0,0.34)", hover: { transform: "translateY(-2px)", borderColor: colors.borderPrimary, boxShadow: "0 18px 44px -32px var(--c-primary-glow)" }, "@media (max-width: 600px)": { alignItems: "stretch", flexDirection: "column", gap: "10px" } }),
  quickstartCopy: css({ display: "flex", alignItems: "center", gap: "12px", minWidth: "0", "@media (max-width: 600px)": { alignItems: "flex-start", flexDirection: "column", gap: "8px" } }),
  quickstartLabel: css({ fontFamily: mono, fontSize: "0.7rem", letterSpacing: "0", textTransform: "uppercase", color: colors.textMuted, flexShrink: 0, fontWeight: "800" }),
  quickstartCode: css({ fontSize: "0.82rem", backgroundColor: colors.bgCode, color: colors.text, border: `1px solid ${colors.border}` }),
  quickstartLink: css({ flexShrink: 0, fontSize: "0.82rem", fontWeight: "600", color: colors.primary, padding: "7px 10px", borderRadius: "6px", transition: "background 0.18s ease, color 0.18s ease", hover: { color: colors.primaryHover, backgroundColor: colors.primaryAlpha08 }, "@media (max-width: 600px)": { textAlign: "center", backgroundColor: colors.primaryAlpha08 } }),
  metaGrid: css({ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginTop: "26px", "@media (max-width: 600px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" } }),
  metaCard: css({ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "14px 16px", minWidth: "0", transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease", hover: { transform: "translateY(-2px)", borderColor: colors.borderLight, boxShadow: "0 14px 32px -24px rgba(0,0,0,0.28)" } }),
  metaValue: css({ fontSize: "1rem", fontWeight: "800", color: colors.text, lineHeight: "1.2", marginBottom: "4px" }),
  metaLabel: css({ fontSize: "0.76rem", color: colors.textMuted }),

  mobileToc: css({ display: "none", "@media (max-width: 900px)": { display: "flex", gap: "8px", position: "sticky", top: "76px", zIndex: 40, overflowX: "auto", padding: "12px 0", margin: "28px 0 0", backgroundColor: colors.bg, borderBottom: `1px solid ${colors.border}`, raw: { "scrollbar-width": "none" }, "&::-webkit-scrollbar": { display: "none" } } }),
  mobileLink: css({ flex: "0 0 auto", fontSize: "0.82rem", color: colors.textDim, border: `1px solid ${colors.border}`, borderRadius: "999px", padding: "6px 11px", backgroundColor: colors.bgCard }),
  mobileLinkActive: css({ color: colors.primary, borderColor: colors.borderPrimary, backgroundColor: colors.primaryAlpha08 }),

  section: css({ animation: `${animations.riseIn} 0.58s cubic-bezier(0.22, 1, 0.36, 1) both`, paddingTop: "46px", marginTop: "46px", borderTop: `1px solid ${colors.border}`, raw: { "scroll-margin-top": "104px" }, hover: { "& .section-anchor": { opacity: "1" } }, "@media (max-width: 600px)": { paddingTop: "34px", marginTop: "34px" } }),
  sectionDelay1: css({ raw: { "animation-delay": "0.04s" } }),
  sectionDelay2: css({ raw: { "animation-delay": "0.08s" } }),
  sectionDelay3: css({ raw: { "animation-delay": "0.12s" } }),
  sectionDelay4: css({ raw: { "animation-delay": "0.16s" } }),
  sectionHead: css({ marginBottom: "14px" }),
  sectionMeta: css({ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }),
  sectionNumber: css({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "22px", borderRadius: "5px", backgroundColor: colors.primaryAlpha08, color: colors.primary, fontFamily: mono, fontSize: "0.68rem", fontWeight: "800" }),
  sectionKicker: css({ fontFamily: mono, fontSize: "0.72rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.accentSecondary, display: "inline-flex" }),
  sectionTitleRow: css({ display: "flex", alignItems: "center", gap: "10px", "@media (max-width: 600px)": { alignItems: "flex-start" } }),
  sectionAnchor: css({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "6px", color: colors.textMuted, border: "1px solid transparent", opacity: "0", transition: "all 0.18s ease", fontFamily: mono, fontSize: "0.86rem", focusVisible: { opacity: "1" }, hover: { color: colors.primary, backgroundColor: colors.primaryAlpha08, borderColor: colors.borderPrimary }, "@media (max-width: 600px)": { opacity: "1", width: "26px", height: "26px", flexShrink: 0 } }),

  apiHeadingRow: css({ display: "flex", alignItems: "center", gap: "8px", margin: "12px 0 10px" }),
  apiLabel: css({ fontSize: "0.75rem", color: colors.textMuted }),
  apiSig: css({ fontFamily: mono, fontSize: "0.82rem", backgroundColor: colors.bgCode, border: `1px solid ${colors.border}`, borderLeft: `3px solid ${colors.accentSecondary}`, borderRadius: "8px", padding: "14px 18px", margin: "16px 0 20px", color: colors.text, overflowX: "auto", lineHeight: "1.7", raw: { "scrollbar-width": "thin" }, maxWidth: "100%", "& .kw": { color: "var(--c-tok-keyword)", fontStyle: "normal" }, "& .fn": { color: "var(--c-tok-fn)", fontStyle: "normal" }, "& .ty": { color: "var(--c-tok-type)", fontStyle: "normal" }, "& .pt": { color: "var(--c-tok-punct)", fontStyle: "normal" }, "& .pr": { color: "var(--c-tok-prop)", fontStyle: "normal" } }),
  apiTag: css({ display: "inline-block", fontSize: "0.7rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", padding: "2px 8px", borderRadius: "4px", verticalAlign: "middle" }),
  apiTagFn: css({ backgroundColor: "rgba(232,200,122,0.15)", color: "var(--c-tok-fn)" }),
  apiTagType: css({ backgroundColor: "rgba(125,214,232,0.12)", color: "var(--c-tok-type)" }),

  rail: css({ position: "sticky", top: "96px", alignSelf: "start", display: "flex", flexDirection: "column", gap: "12px", "@media (max-width: 1180px)": { display: "none" } }),
  railCard: css({ border: `1px solid ${colors.border}`, backgroundColor: colors.bgCard, borderRadius: "8px", padding: "14px", transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease", hover: { transform: "translateY(-2px)", borderColor: colors.borderLight, boxShadow: "0 14px 30px -24px rgba(0,0,0,0.25)" } }),
  railKicker: css({ fontFamily: mono, fontSize: "0.66rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.textMuted, marginBottom: "8px" }),
  railTitle: css({ fontSize: "0.92rem", fontWeight: "800", lineHeight: "1.3", color: colors.text }),
  railGroup: css({ marginTop: "4px", fontSize: "0.76rem", color: colors.accentSecondary }),
  railNav: css({ display: "flex", flexDirection: "column", gap: "4px" }),
  railLink: css({ display: "block", borderRadius: "6px", padding: "7px 8px", color: colors.textDim, fontSize: "0.8rem", lineHeight: "1.35", transition: "color 0.18s ease, background 0.18s ease", hover: { color: colors.text, backgroundColor: colors.bgSecondary } }),
  railLinkActive: css({ color: colors.primary, backgroundColor: colors.primaryAlpha08 }),
};

export function sectionDelay(index: number) {
  if (index === 1) return ds.sectionDelay1;
  if (index === 2) return ds.sectionDelay2;
  if (index === 3) return ds.sectionDelay3;
  if (index >= 4) return ds.sectionDelay4;
  return null;
}
