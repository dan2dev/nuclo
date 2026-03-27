import "nuclo";
import { cn, colors } from "../styles.ts";
import { setRoute, type Route } from "../router.ts";

export type DocsTocItem = {
  id: string;
  label: string;
  mono?: boolean;
};

type DocsHeroOptions = {
  badge: string;
  breadcrumb: string;
  title: string;
  subtitle: string;
  meta: string;
  updated?: string;
  sourceHref?: string;
  sourceLabel?: string;
};

type DocsPageFrameOptions = {
  hero: ReturnType<typeof div> | ReturnType<typeof section>;
  tocItems?: DocsTocItem[];
  children: unknown[];
};

let activeSection = "";
let sectionObserver: IntersectionObserver | null = null;

export const d = {
  page: cn(
    width("100%")
      .maxWidth("1440px")
      .margin("0 auto")
      .backgroundColor(colors.bg)
  ),

  hero: cn(
    backgroundColor(colors.bgCard)
      .borderBottom(`1px solid ${colors.border}`)
      .padding("40px 24px 36px"),
    {
      medium: padding("56px 48px 42px"),
      large: padding("56px 80px 48px"),
    }
  ),

  breadcrumb: cn(
    display("flex")
      .alignItems("center")
      .gap("6px")
      .fontSize("13px")
      .marginBottom("14px")
      .flexWrap("wrap")
  ),

  heroMeta: cn(
    display("flex")
      .alignItems("center")
      .gap("12px")
      .flexWrap("wrap")
      .marginBottom("12px")
  ),

  heroBadge: cn(
    display("inline-flex")
      .alignItems("center")
      .gap("6px")
      .padding("5px 14px")
      .borderRadius("999px")
      .fontSize("12px")
      .fontWeight("600")
      .color(colors.primary)
      .backgroundColor(colors.primaryAlpha08)
      .border(`1px solid ${colors.borderPrimary}`)
  ),

  heroTitle: cn(
    fontSize("40px")
      .fontWeight("800")
      .letterSpacing("-0.04em")
      .lineHeight("1.05")
      .color(colors.text)
      .marginBottom("16px"),
    {
      medium: fontSize("48px"),
      large: fontSize("56px"),
    }
  ),

  heroSubtitle: cn(
    fontSize("17px")
      .lineHeight("1.65")
      .color(colors.textMuted)
      .maxWidth("700px")
      .marginBottom("18px"),
    { medium: fontSize("18px") }
  ),

  heroFooter: cn(
    display("flex")
      .alignItems("center")
      .gap("12px")
      .flexWrap("wrap")
      .fontSize("12px")
  ),

  mobileToc: cn(
    display("flex")
      .gap("8px")
      .overflowX("auto")
      .padding("14px 24px 18px")
      .borderBottom(`1px solid ${colors.border}`)
      .backgroundColor(colors.bg),
    {
      medium: padding("14px 48px 18px"),
      large: display("none"),
    }
  ),

  contentArea: cn(display("flex").width("100%")),

  sidebar: cn(
    display("none")
      .width("260px")
      .flexShrink("0")
      .padding("48px 20px 80px 48px")
      .backgroundColor(colors.bgSecondary)
      .borderRight(`1px solid ${colors.border}`),
    { large: display("block") }
  ),

  sidebarSticky: cn(
    position("sticky")
      .top("96px")
      .display("flex")
      .flexDirection("column")
      .gap("2px")
      .maxHeight("calc(100vh - 128px)")
      .overflowY("auto")
  ),

  main: cn(
    display("flex")
      .flexDirection("column")
      .gap("20px")
      .minWidth("0")
      .padding("40px 24px 72px"),
    {
      medium: padding("48px 48px 80px"),
      large: padding("48px 80px 80px 48px"),
    }
  ),

  sectionIntro: cn(display("flex").flexDirection("column").gap("8px")),

  sectionChipRow: cn(display("flex").alignItems("center").gap("12px").flexWrap("wrap")),

  sectionChip: cn(
    display("inline-flex")
      .alignItems("center")
      .padding("4px 10px")
      .borderRadius("6px")
      .backgroundColor(colors.primaryAlpha08)
      .fontSize("11px")
      .fontWeight("700")
      .letterSpacing("0.14em")
      .textTransform("uppercase")
      .color(colors.primary)
  ),

  sectionTitle: cn(
    fontSize("30px")
      .fontWeight("700")
      .letterSpacing("-0.03em")
      .lineHeight("1.15")
      .color(colors.text),
    { medium: fontSize("34px") }
  ),

  sectionDescription: cn(
    fontSize("15px")
      .lineHeight("1.65")
      .color(colors.textMuted)
      .maxWidth("700px")
  ),
};

function routeHref(route: Route) {
  const base = import.meta.env.BASE_URL || "/";
  return route === "home" ? base : `${base}${route}`;
}

function resetObserver() {
  sectionObserver?.disconnect();
  sectionObserver = null;
}

export function initDocsToc(items: DocsTocItem[]) {
  if (items.length === 0) {
    resetObserver();
    activeSection = "";
    return;
  }

  activeSection = items[0].id;

  setTimeout(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    resetObserver();

    sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        activeSection = visible.target.id;
        update();
      },
      {
        rootMargin: "-112px 0px -62%",
        threshold: [0, 0.2, 0.45],
      }
    );

    items.forEach((item) => {
      const section = document.getElementById(item.id);
      if (section) {
        sectionObserver?.observe(section);
      }
    });
  }, 0);
}

function scrollToSection(id: string) {
  const element = document.getElementById(id);
  if (!element) return;

  const headerOffset = 88;
  const offsetTop = element.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top: offsetTop, behavior: "smooth" });
  activeSection = id;
  update();
}

function DocsTocLink(item: DocsTocItem) {
  const isActive = activeSection === item.id;

  return a(
    { href: `#${item.id}` },
    cn(
      display("inline-flex")
        .alignItems("center")
        .gap("8px")
        .padding("8px 12px")
        .borderRadius("6px")
        .fontSize("13px")
        .color(isActive ? colors.primary : colors.textMuted)
        .backgroundColor(isActive ? colors.primaryAlpha08 : "transparent")
        .fontWeight(isActive ? "600" : "400")
        .transition("all 0.2s")
        .whiteSpace("nowrap")
        .fontFamily(item.mono ? "'JetBrains Mono', 'Courier New', monospace" : "inherit"),
      { hover: color(colors.primary).backgroundColor(colors.primaryAlpha08) }
    ),
    isActive
      ? span(
          cn(
            width("5px")
              .height("5px")
              .borderRadius("999px")
              .backgroundColor(colors.primary)
              .flexShrink("0")
          )
        )
      : null,
    item.label,
    on("click", (e) => {
      e.preventDefault();
      scrollToSection(item.id);
    })
  );
}

function Sidebar(items: DocsTocItem[]) {
  return aside(
    d.sidebar,
    div(
      d.sidebarSticky,
      span(
        cn(
          fontSize("11px")
            .fontWeight("700")
            .letterSpacing("0.12em")
            .textTransform("uppercase")
            .color(colors.textDim)
            .marginBottom("8px")
        ),
        "On this page"
      ),
      ...items.map((item) => DocsTocLink(item))
    )
  );
}

function MobileToc(items: DocsTocItem[]) {
  return div(d.mobileToc, ...items.map((item) => DocsTocLink(item)));
}

export function DocsHero(opts: DocsHeroOptions) {
  return section(
    d.hero,
    div(
      d.breadcrumb,
      a(
        { href: routeHref("home") },
        cn(color(colors.textDim).transition("color 0.2s")),
        { hover: color(colors.textMuted) },
        "Docs",
        on("click", (e) => {
          e.preventDefault();
          setRoute("home");
        })
      ),
      span(cn(color(colors.border)), "›"),
      span(cn(color(colors.primary).fontWeight("600")), opts.breadcrumb)
    ),
    div(
      d.heroMeta,
      span(
        d.heroBadge,
        span(
          cn(
            width("6px")
              .height("6px")
              .borderRadius("999px")
              .backgroundColor(colors.primary)
          )
        ),
        opts.badge
      ),
      span(cn(fontSize("13px").color(colors.textDim)), opts.meta)
    ),
    h1(d.heroTitle, opts.title),
    p(d.heroSubtitle, opts.subtitle),
    opts.updated || opts.sourceHref
      ? div(
          d.heroFooter,
          opts.updated ? span(cn(color(colors.textDim)), opts.updated) : null,
          opts.updated && opts.sourceHref ? span(cn(color(colors.border)), "·") : null,
          opts.sourceHref
            ? a(
                {
                  href: opts.sourceHref,
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
                cn(color(colors.primary).transition("opacity 0.2s")),
                { hover: opacity("0.72") },
                opts.sourceLabel ?? "View source on GitHub ↗"
              )
            : null
        )
      : null
  );
}

export function DocsSectionHeader(index: string, title: string, description: string, monoTitle = false) {
  return div(
    d.sectionIntro,
    div(
      d.sectionChipRow,
      span(d.sectionChip, index),
      h2(
        d.sectionTitle,
        monoTitle
          ? { style: { fontFamily: "'JetBrains Mono', 'Courier New', monospace" } }
          : {},
        title
      )
    ),
    p(d.sectionDescription, description)
  );
}

export function DocsPageFrame(opts: DocsPageFrameOptions) {
  const tocItems = opts.tocItems ?? [];
  initDocsToc(tocItems);

  return div(
    d.page,
    opts.hero,
    tocItems.length > 0 ? MobileToc(tocItems) : null,
    div(
      d.contentArea,
      tocItems.length > 0 ? Sidebar(tocItems) : null,
      main(d.main, ...(opts.children as HTMLElement[]))
    )
  );
}
