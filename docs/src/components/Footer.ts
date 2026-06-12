import { css, colors, s } from "../styles.ts";
import { setRoute } from "../router.ts";
import { GitHubSvg } from "./icons.ts";

const GITHUB_URL = "https://github.com/dan2dev/nuclo";

export function Footer() {
  const footerStyle = css({ position: "relative", backgroundColor: colors.bgFooter, padding: "56px 0 28px", medium: { padding: "64px 0 32px" } });

  const topGrid = css({ display: "grid", gridTemplateColumns: "1fr", gap: "36px", paddingBottom: "40px", medium: { gridTemplateColumns: "minmax(0, 1.6fr) 1fr 1fr", gap: "28px" } });

  const brandGroup = css({ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "14px", maxWidth: "320px" });

  const tagline = css({ fontSize: "0.875rem", color: colors.textDim, lineHeight: "1.65" });

  const builtWith = css({ display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: colors.textMuted, padding: "5px 11px", borderRadius: "999px", border: `1px solid ${colors.border}`, backgroundColor: colors.bgCard });

  const colTitle = css({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: colors.textMuted, marginBottom: "14px" });

  const colLinks = css({ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" });

  const linkStyle = css({ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", fontWeight: "500", color: colors.textDim, transition: "color 0.18s ease", cursor: "pointer", padding: "5px 0", hover: { color: colors.primary } });

  const bottomBar = css({ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", justifyContent: "space-between", paddingTop: "24px", borderTop: `1px solid ${colors.border}`, medium: { flexDirection: "row" } });

  const fineprint = css({ fontSize: "0.78rem", color: colors.textMuted });

  const versionBadge = css({ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", fontWeight: "700", color: colors.primary, padding: "3px 10px", borderRadius: "999px", backgroundColor: colors.primaryAlpha08, border: `1px solid ${colors.borderPrimary}` });

  function RouteLink(label: string, route: string) {
    return span(linkStyle, label, on("click", () => setRoute(route)));
  }

  function ExternalLink(label: string, href: string, icon?: ReturnType<typeof svgSvg>) {
    return a(
      { href, target: "_blank", rel: "noopener noreferrer" },
      linkStyle,
      icon ?? null,
      label,
    );
  }

  return footer(
    footerStyle,
    // Gradient hairline along the top edge
    div(
      { className: "hairline", "aria-hidden": "true" },
      css({ position: "absolute", left: "0", right: "0", top: "0" }),
    ),
    div(
      s.container,
      div(
        topGrid,
        // Brand column
        div(
          brandGroup,
          img(
            { src: "/nuclo-logo.svg", alt: "Nuclo", class: "brand-logo" },
            css({ height: "40px", width: "auto" }),
          ),
          span(tagline, "The explicit UI runtime. Plain functions, mutable state, and one call — update() — between your data and the DOM."),
          span(
            builtWith,
            span({ className: "badge-dot" }),
            "this site is built with nuclo",
          ),
        ),
        // Explore column
        div(
          div(colTitle, "Explore"),
          div(
            colLinks,
            RouteLink("Documentation", "docs"),
            RouteLink("Examples", "examples"),
            ExternalLink("README", `${GITHUB_URL}#readme`),
          ),
        ),
        // Project column
        div(
          div(colTitle, "Project"),
          div(
            colLinks,
            ExternalLink("GitHub", GITHUB_URL, GitHubSvg({ size: 14 })),
            ExternalLink("Releases", `${GITHUB_URL}/releases`),
            ExternalLink("MIT License", `${GITHUB_URL}/blob/main/LICENSE.md`),
          ),
        ),
      ),
      div(
        bottomBar,
        span(fineprint, "© 2026 Danilo Castro (@dan2dev) · MIT License"),
        span(versionBadge, "v0.2.1"),
      ),
    ),
  );
}
