import { css, colors } from "../../styles.ts";
import { animations } from "../../styles/animations.ts";

const mono = "ui-monospace, monospace";

const contentTypography = {
  // Only the intro's title is an h1 here.
  "& h1": { raw: { "font-size": "2.85rem", "font-weight": "800", "margin-bottom": "14px", "line-height": "1.06", "letter-spacing": "0" } },
  "& h2": { raw: { "font-size": "1.58rem", "font-weight": "700", margin: "0", "line-height": "1.24", "letter-spacing": "-0.01em" } },
  "& h3": { raw: { "font-size": "1.0625rem", "font-weight": "600", "margin-top": "32px", "margin-bottom": "10px", "scroll-margin-top": "calc(var(--header-h) + 16px)" } },
  "& p": { raw: { "font-size": "0.9375rem", color: "var(--c-text-dim)", "line-height": "1.75", "margin-bottom": "18px" } },
  "& ul": { raw: { margin: "0 0 18px 0", "padding-left": "20px", color: "var(--c-text-dim)", "font-size": "0.9375rem" } },
  "& ol": { raw: { margin: "0 0 18px 0", "padding-left": "20px", color: "var(--c-text-dim)", "font-size": "0.9375rem" } },
  "& li": { raw: { "margin-bottom": "6px", "line-height": "1.7" } },
  "& li::marker": { raw: { color: "var(--c-text-muted)" } },
  // Prose links: accent ink plus an underline, so they don't rely on colour alone.
  "& p a, & li a": { raw: { color: "var(--c-primary-ink)", "text-decoration": "underline", "text-decoration-color": "var(--c-border-light)", "text-underline-offset": "3px" } },
  "& p a:hover, & li a:hover": { raw: { "text-decoration-color": "currentColor" } },
  "& code": { raw: { "font-family": mono, "font-size": "0.875em", "background-color": "var(--c-bg-secondary)", padding: "1px 5px", "border-radius": "4px", color: "var(--c-text)" } },
  // The intro's quick-start command keeps its original look.
  "& > header code": { raw: { "font-size": "0.82em", padding: "2px 6px", color: "var(--c-primary-hover)" } },
  "& pre": { raw: { "max-width": "100%", "overflow-x": "auto" } },
  "& .kw": { raw: { color: "var(--c-tok-keyword)" } },
  "& .st": { raw: { color: "var(--c-tok-string)" } },
  "& .fn": { raw: { color: "var(--c-tok-fn)" } },
  "& .cm": { raw: { color: "var(--c-tok-comment)", "font-style": "italic" } },
  "& .nm": { raw: { color: "var(--c-tok-number)" } },
  "& .ty": { raw: { color: "var(--c-tok-type)" } },
  "& .pt": { raw: { color: "var(--c-tok-punct)" } },
  "& .pr": { raw: { color: "var(--c-tok-prop)" } },
  "& .code-block-frame": { raw: { margin: "22px 0", "background-color": "var(--c-bg-code)", border: "1px solid var(--c-border)", "border-radius": "10px", overflow: "hidden", "max-width": "100%" } },
  "& .code-block-header": { raw: { display: "flex", "align-items": "center", "justify-content": "space-between", "min-height": "38px", padding: "9px 16px", "border-bottom": "1px solid var(--c-border)" } },
  "& .code-block-filename": { raw: { "font-family": mono, "font-size": "0.75rem", color: "var(--c-text-muted)" } },
  "& .code-block-body": { raw: { padding: "18px 20px 20px", "overflow-x": "auto", color: "var(--c-text)", "font-family": mono, "font-size": "0.8rem", "line-height": "1.7", "scrollbar-width": "thin" } },
  "& .code-block-body pre": { raw: { margin: "0", "white-space": "pre", "min-width": "max-content" } },
  "& .docs-callout": { raw: { "background-color": "var(--c-bg-secondary)", border: "1px solid var(--c-border)", "border-radius": "10px", padding: "16px 18px", margin: "20px 0", "font-size": "0.9375rem", "line-height": "1.65", color: "var(--c-text-dim)" } },
  "& table": { raw: { display: "block", "max-width": "100%", "overflow-x": "auto", "border-collapse": "collapse", margin: "0 0 20px", "font-size": "0.875rem", color: "var(--c-text-dim)" } },
  "& th": { raw: { "text-align": "left", "white-space": "nowrap", "font-weight": "700", color: "var(--c-text)", padding: "8px 14px 8px 0", "border-bottom": "1px solid var(--c-border)" } },
  "& td": { raw: { padding: "8px 14px 8px 0", "border-bottom": "1px solid var(--c-border)", "vertical-align": "top" } },
  "& .docs-callout strong": { raw: { color: "var(--c-text)" } },
} as const;

export const ds = {
  layout: css("pages-docs-styles-layout", { display: "grid", gridTemplateColumns: "228px minmax(0, 840px) 184px", gap: "34px", maxWidth: "1336px", margin: "0 auto", padding: "0 28px", minHeight: "100vh", alignItems: "start", raw: { "scrollbar-width": "thin" }, "@media (max-width: 1180px)": { gridTemplateColumns: "224px minmax(0, 1fr)", maxWidth: "1080px", gap: "42px" }, "@media (max-width: 900px)": { display: "block", padding: "0 24px" }, "@media (max-width: 600px)": { padding: "0 18px" } }),

  sidebar: css("pages-docs-styles-sidebar", { display: "flex", flexDirection: "column", gap: "20px", padding: "0 16px 24px 0", borderRight: `1px solid ${colors.border}`, position: "sticky", top: "calc(var(--header-h) + 20px)", height: "calc(100vh - var(--header-h) - 36px)", overflowY: "auto", alignSelf: "start", "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-track": { backgroundColor: "transparent" }, "&::-webkit-scrollbar-thumb": { backgroundColor: colors.borderLight, borderRadius: "2px" }, "@media (max-width: 900px)": { display: "none" } }),

  // Shared by the sidebar (> 900px) and the navigator sheet (only opened at <= 900px, so its touch sizes live in the 900px query).
  filterWrap: css("pages-docs-styles-filterWrap", { display: "block" }),
  filter: css("pages-docs-styles-filter", { display: "block", width: "100%", height: "36px", padding: "0 12px", border: `1px solid ${colors.border}`, borderRadius: "8px", backgroundColor: colors.bg, color: colors.text, fontFamily: "inherit", fontSize: "14px", raw: { appearance: "none" }, "@media (max-width: 900px)": { height: "44px", borderRadius: "10px", fontSize: "16px" } }),
  navGroups: css("pages-docs-styles-navGroups", { display: "flex", flexDirection: "column", gap: "4px", "@media (max-width: 900px)": { gap: "0" } }),
  navGroupButton: css("pages-docs-styles-navGroupButton", { display: "flex", alignItems: "center", gap: "8px", width: "100%", height: "32px", padding: "0 10px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", color: colors.text, textAlign: "left", hover: { backgroundColor: colors.bgSecondary }, "& span": { flex: "1" }, "& svg": { flexShrink: 0, color: colors.textMuted, transition: "transform 0.15s ease" }, '&[aria-expanded="false"] svg': { transform: "rotate(-90deg)" }, "@media (max-width: 900px)": { height: "44px", padding: "0 12px", borderRadius: "8px", color: colors.textMuted } }),
  navLinks: css("pages-docs-styles-navLinks", { margin: "2px 0 12px", "@media (max-width: 900px)": { margin: "0 0 8px" } }),
  navLink: css("pages-docs-styles-navLink", { display: "block", padding: "6px 10px", borderRadius: "6px", fontSize: "14px", lineHeight: "20px", color: colors.textDim, hover: { color: colors.text, backgroundColor: colors.bgSecondary }, "@media (max-width: 900px)": { padding: "12px", borderRadius: "8px", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }),
  navLinkActive: css("pages-docs-styles-navLinkActive", { color: colors.primaryInk, backgroundColor: colors.bgSecondary, fontWeight: "500", hover: { color: colors.primaryInk } }),

  content: css("pages-docs-styles-content", { padding: "0 0 76px", maxWidth: "820px", width: "100%", minWidth: "0", ...contentTypography, "@media (max-width: 1180px)": { maxWidth: "100%" }, "@media (max-width: 900px)": { padding: "0 0 60px", maxWidth: "100%", "& h3": { raw: { "scroll-margin-top": "calc(var(--header-h) + 64px)" } } }, "@media (max-width: 600px)": { "& h1": { raw: { "font-size": "2rem" } }, "& h2": { raw: { "font-size": "1.28rem" } } } }),
  hero: css("pages-docs-styles-hero", { position: "relative", animation: `${animations.riseIn} 0.58s cubic-bezier(0.22, 1, 0.36, 1) both`, borderRadius: "28px", backgroundColor: colors.bgCard, boxShadow: "var(--c-shadow)", padding: "28px 20px 32px", marginBottom: "40px", "@media (min-width: 600px)": { padding: "44px 40px 48px" } }),
  heroShell: css("pages-docs-styles-heroShell", { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 170px", alignItems: "center", gap: "28px", "@media (max-width: 700px)": { display: "block" } }),
  heroCopy: css("pages-docs-styles-heroCopy", { minWidth: "0" }),
  heroMarkWrap: css("pages-docs-styles-heroMarkWrap", { display: "flex", justifyContent: "flex-end", "@media (max-width: 700px)": { display: "none" } }),
  heroMark: css("pages-docs-styles-heroMark", { width: "138px", height: "138px", transform: "rotate(7deg)", filter: "drop-shadow(0 24px 30px rgba(255,63,0,0.22))" }),
  eyebrow: css("pages-docs-styles-eyebrow", { fontFamily: mono, fontSize: "0.72rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.primary, marginBottom: "12px" }),
  lead: css("pages-docs-styles-lead", { fontSize: "1.05rem", color: colors.textDim, lineHeight: "1.75", maxWidth: "720px", marginBottom: "0" }),
  quickstart: css("pages-docs-styles-quickstart", { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "18px", marginTop: "24px", padding: "13px 14px 13px 16px", backgroundColor: colors.bgSecondary, borderRadius: "16px", transition: "transform 0.2s ease", boxShadow: "0 18px 42px -34px rgba(0,0,0,0.34)", hover: { transform: "translateY(-2px)", boxShadow: "0 18px 44px -32px var(--c-primary-glow)" }, "@media (max-width: 600px)": { alignItems: "stretch", flexDirection: "column", gap: "10px" } }),
  quickstartCopy: css("pages-docs-styles-quickstartCopy", { display: "flex", alignItems: "center", gap: "12px", minWidth: "0", "@media (max-width: 600px)": { alignItems: "flex-start", flexDirection: "column", gap: "8px" } }),
  quickstartLabel: css("pages-docs-styles-quickstartLabel", { fontFamily: mono, fontSize: "0.7rem", letterSpacing: "0", textTransform: "uppercase", color: colors.textMuted, flexShrink: 0, fontWeight: "800" }),
  quickstartCode: css("pages-docs-styles-quickstartCode", { fontSize: "0.82rem", backgroundColor: colors.bgCode, color: colors.text }),
  quickstartLink: css("pages-docs-styles-quickstartLink", { flexShrink: 0, fontSize: "0.82rem", fontWeight: "600", color: colors.primary, padding: "7px 10px", borderRadius: "6px", hover: { color: colors.primaryHover, backgroundColor: colors.primaryAlpha08 }, "@media (max-width: 600px)": { textAlign: "center", backgroundColor: colors.primaryAlpha08 } }),
  metaGrid: css("pages-docs-styles-metaGrid", { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginTop: "26px", "@media (max-width: 600px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" } }),
  metaCard: css("pages-docs-styles-metaCard", { backgroundColor: colors.bgSecondary, borderRadius: "14px", padding: "14px 16px", minWidth: "0", transition: "transform 0.2s ease", hover: { transform: "translateY(-2px)", boxShadow: "0 14px 32px -24px rgba(0,0,0,0.28)" } }),
  metaValue: css("pages-docs-styles-metaValue", { fontSize: "1rem", fontWeight: "800", color: colors.text, lineHeight: "1.2", marginBottom: "4px" }),
  metaLabel: css("pages-docs-styles-metaLabel", { fontSize: "0.76rem", color: colors.textMuted }),

  // Mobile (<= 900px) section bar: full-bleed, sticks under the header, opens the navigator sheet.
  sectionBar: css("pages-docs-styles-sectionBar", { display: "none", "@media (max-width: 900px)": { display: "block", position: "sticky", top: "var(--header-h)", zIndex: 40, height: "48px", margin: "0 -24px", padding: "0 24px", backgroundColor: colors.bg, borderBottom: `1px solid ${colors.border}` }, "@media (max-width: 600px)": { margin: "0 -18px", padding: "0 18px" } }),
  sectionBarButton: css("pages-docs-styles-sectionBarButton", { display: "flex", alignItems: "center", gap: "6px", width: "100%", height: "47px", fontSize: "14px", color: colors.textMuted, textAlign: "left", "& svg": { marginLeft: "auto", flexShrink: 0 } }),
  sectionBarGroup: css("pages-docs-styles-sectionBarGroup", { flexShrink: 0, whiteSpace: "nowrap" }),
  sectionBarTitle: css("pages-docs-styles-sectionBarTitle", { minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: colors.text }),

  scrim: css("pages-docs-styles-scrim", { position: "fixed", top: "0", right: "0", bottom: "0", left: "0", zIndex: 240, backgroundColor: "rgba(0,0,0,0.45)", cursor: "default" }),
  sheet: css("pages-docs-styles-sheet", { position: "fixed", left: "0", right: "0", bottom: "0", zIndex: 241, height: "min(700px, 85vh)", display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: "16px 16px 0 0", borderTop: `1px solid ${colors.border}`, backgroundColor: colors.bgCard }),
  sheetDrag: css("pages-docs-styles-sheetDrag", { flexShrink: 0, cursor: "grab", raw: { "touch-action": "none" } }),
  sheetGrabber: css("pages-docs-styles-sheetGrabber", { flexShrink: 0, width: "32px", height: "4px", margin: "8px auto 0", borderRadius: "2px", backgroundColor: colors.borderLight }),
  sheetHead: css("pages-docs-styles-sheetHead", { flexShrink: 0, display: "flex", alignItems: "center", height: "52px", padding: "0 6px 0 20px" }),
  sheetTitle: css("pages-docs-styles-sheetTitle", { flex: "1", fontSize: "17px", fontWeight: "600", color: colors.text }),
  sheetClose: css("pages-docs-styles-sheetClose", { display: "flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", borderRadius: "8px", color: colors.textDim, hover: { color: colors.text, backgroundColor: colors.bgSecondary } }),
  sheetFilterWrap: css("pages-docs-styles-sheetFilterWrap", { display: "block", flexShrink: 0, padding: "4px 16px 12px" }),
  sheetList: css("pages-docs-styles-sheetList", { flex: "1", minHeight: "0", overflowY: "auto", padding: "0 8px 24px", raw: { "overscroll-behavior": "contain" } }),

  section: css("pages-docs-styles-section", { animation: `${animations.riseIn} 0.58s cubic-bezier(0.22, 1, 0.36, 1) both`, paddingTop: "46px", marginTop: "46px", borderTop: `1px solid ${colors.border}`, raw: { "scroll-margin-top": "calc(var(--header-h) + 28px)" }, hover: { "& .section-anchor": { opacity: "1" } }, "@media (max-width: 900px)": { raw: { "scroll-margin-top": "calc(var(--header-h) + 76px)" } }, "@media (max-width: 600px)": { paddingTop: "34px", marginTop: "34px" } }),
  sectionDelay1: css("pages-docs-styles-sectionDelay1", { raw: { "animation-delay": "0.04s" } }),
  sectionDelay2: css("pages-docs-styles-sectionDelay2", { raw: { "animation-delay": "0.08s" } }),
  sectionDelay3: css("pages-docs-styles-sectionDelay3", { raw: { "animation-delay": "0.12s" } }),
  sectionDelay4: css("pages-docs-styles-sectionDelay4", { raw: { "animation-delay": "0.16s" } }),
  sectionHead: css("pages-docs-styles-sectionHead", { marginBottom: "14px" }),
  // "01 Introduction", like the home pipeline's step line.
  sectionMeta: css("pages-docs-styles-sectionMeta", { display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "8px", fontSize: "0.8125rem", fontWeight: "500", color: colors.textMuted }),
  sectionNumber: css("pages-docs-styles-sectionNumber", { fontFamily: mono, color: colors.primaryInk }),
  sectionTitleRow: css("pages-docs-styles-sectionTitleRow", { display: "flex", alignItems: "center", gap: "10px", "@media (max-width: 600px)": { alignItems: "flex-start" } }),
  sectionAnchor: css("pages-docs-styles-sectionAnchor", { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "6px", color: colors.textMuted, opacity: "0", transition: "opacity 0.18s ease", fontFamily: mono, fontSize: "0.86rem", focusVisible: { opacity: "1" }, hover: { color: colors.primaryInk, backgroundColor: colors.bgSecondary }, "@media (max-width: 600px)": { opacity: "1", width: "26px", height: "26px", flexShrink: 0 } }),

  apiHeadingRow: css("pages-docs-styles-apiHeadingRow", { display: "flex", alignItems: "baseline", gap: "8px", margin: "12px 0 10px", fontSize: "0.8125rem", color: colors.textMuted }),
  apiTag: css("pages-docs-styles-apiTag", { fontFamily: mono }),
  apiSig: css("pages-docs-styles-apiSig", { fontFamily: mono, fontSize: "0.8rem", backgroundColor: colors.bgCode, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "16px 20px", margin: "16px 0 20px", color: colors.text, overflowX: "auto", lineHeight: "1.7", whiteSpace: "pre-wrap", raw: { "scrollbar-width": "thin" }, maxWidth: "100%", "& .kw": { color: "var(--c-tok-keyword)", fontStyle: "normal" }, "& .fn": { color: "var(--c-tok-fn)", fontStyle: "normal" }, "& .ty": { color: "var(--c-tok-type)", fontStyle: "normal" }, "& .pt": { color: "var(--c-tok-punct)", fontStyle: "normal" }, "& .pr": { color: "var(--c-tok-prop)", fontStyle: "normal" } }),

  rail: css("pages-docs-styles-rail", { position: "sticky", top: "calc(var(--header-h) + 20px)", alignSelf: "start", "@media (max-width: 1180px)": { display: "none" } }),
  toc: css("pages-docs-styles-toc", { marginBottom: "20px" }),
  tocTitle: css("pages-docs-styles-tocTitle", { fontSize: "13px", fontWeight: "600", color: colors.text, marginBottom: "6px" }),
  tocLink: css("pages-docs-styles-tocLink", { display: "block", padding: "5px 0", fontSize: "13px", lineHeight: "1.45", color: colors.textMuted, hover: { color: colors.text } }),

  srOnly: css("pages-docs-styles-srOnly", { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }),
  // Last base rule so it wins over the display set above (none of the toggled elements set display in a media query).
  hidden: css("pages-docs-styles-hidden", { display: "none" }),
};

export function sectionDelay(index: number) {
  if (index === 1) return ds.sectionDelay1;
  if (index === 2) return ds.sectionDelay2;
  if (index === 3) return ds.sectionDelay3;
  if (index >= 4) return ds.sectionDelay4;
  return null;
}
