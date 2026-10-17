import { css, colors, s } from "../styles.ts";
import { href } from "../router.ts";
import { NucloBrand } from "./NucloBrand.ts";
import { GitHubSvg } from "./icons.ts";
import { NUCLO_VERSION } from "../generated/nuclo-stats.ts";
import { t } from "../i18n/index.ts";

const GITHUB_URL = "https://github.com/dan2dev/nuclo";
// Built once: a locale switch rebuilds Footer() over the same svg (see NucloBrand.ts).
const brand = NucloBrand({ height: 38, animate: "visible" });

export function Footer() {
  const L = t.footer;
  const footerStyle = css("components-footer-footerStyle", { position: "relative", backgroundColor: colors.bgFooter, padding: "56px 0 28px", borderTop: `1px solid ${colors.border}`, medium: { padding: "66px 0 32px" } });

  const topGrid = css("components-footer-topGrid", { display: "grid", gridTemplateColumns: "1fr", gap: "36px", paddingBottom: "40px", medium: { gridTemplateColumns: "minmax(0, 1.65fr) 1fr 1fr", gap: "30px" } });

  const brandGroup = css("components-footer-brandGroup", { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "14px", maxWidth: "360px" });

  const tagline = css("components-footer-tagline", { fontSize: "0.875rem", color: colors.textDim, lineHeight: "1.65" });

  const builtWith = css("components-footer-builtWith", { fontSize: "0.8125rem", color: colors.textMuted });

  const colTitle = css("components-footer-colTitle", { fontSize: "0.875rem", fontWeight: "600", color: colors.text, marginBottom: "10px" });

  const colLinks = css("components-footer-colLinks", { display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start", listStyle: "none" });

  const linkStyle = css("components-footer-linkStyle", { display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 0", fontSize: "0.875rem", color: colors.textDim, hover: { color: colors.text } });

  const bottomBar = css("components-footer-bottomBar", { display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", justifyContent: "space-between", paddingTop: "24px", borderTop: `1px solid ${colors.border}`, medium: { flexDirection: "row" } });

  const fineprint = css("components-footer-fineprint", { fontSize: "0.8125rem", color: colors.textMuted });

  const version = css("components-footer-version", { fontFamily: "ui-monospace, monospace", fontSize: "0.8125rem", color: colors.textMuted });

  function RouteLink(label: string, route: string) {
    return li(a(linkStyle, { href: href(`/${route}`) }, label));
  }

  function ExternalLink(label: string, href: string, icon?: ReturnType<typeof svgSvg>) {
    return li(a(
      { href, target: "_blank", rel: "noopener noreferrer" },
      linkStyle,
      icon ?? null,
      label,
    ));
  }

  return footer(
    footerStyle,
    div(
      s.container,
      div(
        topGrid,
        // Brand column
        div(
          brandGroup,
          brand,
          span(tagline, L.tagline),
          span(builtWith, L.builtWith),
        ),
        // Explore column
        div(
          h2(colTitle, L.explore),
          ul(
            colLinks,
            RouteLink(L.documentation, "docs"),
            RouteLink(L.examples, "examples"),
            ExternalLink(L.readme, `${GITHUB_URL}#readme`),
            ExternalLink("llms.txt", "/llms.txt"),
          ),
        ),
        // Project column
        div(
          h2(colTitle, L.project),
          ul(
            colLinks,
            ExternalLink(L.github, GITHUB_URL, GitHubSvg({ size: 16 })),
            ExternalLink(L.license, `${GITHUB_URL}/blob/main/LICENSE.md`),
          ),
        ),
      ),
      div(
        bottomBar,
        span(fineprint, L.fineprint),
        span(version, `v${NUCLO_VERSION}`),
      ),
    ),
  );
}
