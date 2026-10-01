import { css, cx } from "../styles.ts";
import { DOC_GROUPS, DOC_SECTIONS, SECTION_MAP } from "./docs/content.ts";
import { ds, sectionDelay } from "./docs/styles.ts";
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../generated/nuclo-stats.ts";
import { docsSection } from "../docs-state.ts";


const DOC_FACTS = [
  { label: "Current release", value: `v${NUCLO_VERSION}` },
  { label: "Tag builders", value: "175" },
  { label: "Gzipped ESM", value: `~${NUCLO_GZIP_KB} KB` },
  { label: "Runtime model", value: "Explicit" },
];

function getInitialSectionId(): string {
  if (typeof window === "undefined") return "overview";
  const id = window.location.hash.replace(/^#/, "");
  return SECTION_MAP.has(id) ? id : "overview";
}

function sectionNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

// Sections with ids added to their <h3>s, plus those headings for "On this page".
// content.ts stays plain HTML; the ids exist only in the rendered output.
const SECTIONS = DOC_SECTIONS.map((sec) => {
  const headings: { id: string; text: string }[] = [];
  const withIds = (html: string) => html.replace(/<h3>([\s\S]*?)<\/h3>/g, (_, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const id = `${sec.id}--${text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
    headings.push({ id, text });
    return `<h3 id="${id}">${inner}</h3>`;
  });
  return { ...sec, content: withIds(sec.content), afterContent: sec.afterContent && withIds(sec.afterContent), headings };
});

// The header breadcrumb reads the active section from docsSection.
function publishSection(id: string) {
  const sec = SECTION_MAP.get(id);
  docsSection.group = sec?.groupTitle ?? "";
  docsSection.title = sec?.title ?? "";
}

const CHEVRON = "M6 9l6 6 6-6";
const CLOSE = "M6 6l12 12 M18 6L6 18";

function icon(size: number, d: string) {
  return svgSvg(
    { width: String(size), height: String(size), viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    pathSvg({ d }),
  );
}

export function DocsPage() {
  let activeId = getInitialSectionId();
  publishSection(activeId);
  // Docs navigation state, shared by the sidebar and the mobile sheet.
  let filter = "";
  let sheetOpen = false;
  const toggled: Record<string, boolean> = {}; // groups the user opened/closed; the rest follow the active section

  function setActive(id: string) {
    activeId = id;
    publishSection(id);
    update();
  }

  const query = () => filter.trim().toLowerCase();
  const matches = (id: string) => !!SECTION_MAP.get(id)?.title.toLowerCase().includes(query());
  const isOpen = (group: (typeof DOC_GROUPS)[number]) =>
    !!query() || (toggled[group.title] ?? SECTION_MAP.get(activeId)?.groupTitle === group.title);

  function onSheetKey(e: KeyboardEvent) {
    if (e.key === "Escape") return setSheet(false);
    if (e.key !== "Tab") return;
    // aria-modal: Tab wraps between the sheet's first and last visible controls.
    const items = [...document.querySelectorAll<HTMLElement>('[role="dialog"] :is(a, button, input)')].filter(el => el.offsetParent);
    const edge = e.shiftKey ? items[0] : items[items.length - 1];
    if (document.activeElement === edge) {
      e.preventDefault();
      (e.shiftKey ? items[items.length - 1] : items[0]).focus();
    }
  }

  // Opening the sheet locks page scroll and listens for Escape; closing undoes both.
  function setSheet(open: boolean) {
    sheetOpen = open;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) document.addEventListener("keydown", onSheetKey);
    else document.removeEventListener("keydown", onSheetKey);
    update();
    document.getElementById(open ? "docs-sheet-close" : "docs-section-bar")?.focus({ preventScroll: true });
  }

  function scrollToSection(id: string) {
    if (typeof document === "undefined") return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }

  // A nav click keeps its item highlighted until the user scrolls again; otherwise
  // the observer can pick a neighbour (short sections, or the end of the page).
  let pinned = false;
  let release: AbortController | undefined;
  function jumpTo(id: string) {
    pinned = true;
    release?.abort();
    const ac = (release = new AbortController());
    scrollToSection(id);
    // Skip the jump's own scroll event, then unpin on the next one.
    setTimeout(() => window.addEventListener("scroll", () => { pinned = false; }, { once: true, passive: true, signal: ac.signal }), 100);
  }

  function SectionLink(id: string) {
    const sec = SECTION_MAP.get(id);
    if (!sec) return span();

    return a(
      ds.navLink,
      {
        class: () => cx(ds.navLink, activeId === id ? ds.navLinkActive : null, matches(id) ? null : ds.hidden).className,
        href: `#${id}`,
        "aria-current": () => activeId === id ? "location" : "false",
      },
      sec.title,
      {
        onClick: (e) => {
          e.preventDefault();
          if (sheetOpen) setSheet(false);
          window.history.replaceState(null, "", `#${id}`);
          setActive(id);
          jumpTo(id);
        },
      },
    );
  }

  function Filter(wrapStyle: ReturnType<typeof css>) {
    return label(
      wrapStyle,
      span(ds.srOnly, "Filter sections"),
      input(
        ds.filter,
        { type: "search", placeholder: "Filter", autocomplete: "off", value: () => filter },
        { onInput: (e) => { filter = (e.target as HTMLInputElement).value; update(); } },
      ),
    );
  }

  // Collapsible groups; while filtering, every group is open and empty ones hide.
  function NavGroups() {
    return DOC_GROUPS.map(group =>
      div(
        { class: () => group.sections.some(matches) ? "" : ds.hidden.className },
        button(
          ds.navGroupButton,
          { type: "button", "aria-expanded": () => String(isOpen(group)) },
          span(group.title),
          icon(14, CHEVRON),
          {
            onClick: () => {
              if (query()) return;
              toggled[group.title] = !isOpen(group);
              update();
            },
          },
        ),
        div(
          ds.navLinks,
          { class: () => cx(ds.navLinks, isOpen(group) ? null : ds.hidden).className },
          ...group.sections.map(id => SectionLink(id)),
        ),
      )
    );
  }

  function DocsIntro() {
    return header(
      ds.hero,
      div(
        ds.heroShell,
        div(
          ds.heroCopy,
          div(ds.eyebrow, "Documentation"),
          h1("Nuclo documentation"),
          p(
            ds.lead,
            "A practical reference for installing Nuclo, building with explicit updates, styling with typed CSS, and rendering server-side HTML.",
          ),
        ),
        div(
          ds.heroMarkWrap,
          img(ds.heroMark, { src: "/nuclo-icon@3x.png", alt: "", "aria-hidden": "true" }),
        ),
      ),
      div(
        ds.quickstart,
        div(
          ds.quickstartCopy,
          span(ds.quickstartLabel, "Quick start"),
          code(ds.quickstartCode, "npm create nuclo@latest"),
        ),
        a(
          ds.quickstartLink,
          { href: "#quick-start" },
          "Quick Start",
          {
            onClick: (e) => {
              e.preventDefault();
              window.history.replaceState(null, "", "#quick-start");
              setActive("quick-start");
              jumpTo("quick-start");
            },
          },
        ),
      ),
      div(
        ds.metaGrid,
        ...DOC_FACTS.map(({ label, value }) =>
          div(
            ds.metaCard,
            div(ds.metaValue, value),
            div(ds.metaLabel, label),
          )
        ),
      ),
    );
  }

  function DocsProgress() {
    return div(
      ds.progress,
      { "aria-hidden": "true" },
      div(ds.progressFill),
    );
  }

  function SectionBar() {
    return div(
      ds.sectionBar,
      button(
        ds.sectionBarButton,
        { type: "button", id: "docs-section-bar", "aria-haspopup": "dialog", "aria-expanded": () => String(sheetOpen) },
        span(ds.sectionBarGroup, () => SECTION_MAP.get(activeId)?.groupTitle ?? ""),
        span({ "aria-hidden": "true" }, "/"),
        span(ds.sectionBarTitle, () => SECTION_MAP.get(activeId)?.title ?? ""),
        icon(16, CHEVRON),
        { onClick: () => setSheet(true) },
      ),
    );
  }

  function Sheet() {
    return when(
      () => sheetOpen,
      button(ds.scrim, { type: "button", "aria-label": "Close navigator" }, { onClick: () => setSheet(false) }),
      div(
        ds.sheet,
        { role: "dialog", "aria-modal": "true", "aria-label": "Documentation" },
        div(ds.sheetGrabber, { "aria-hidden": "true" }),
        div(
          ds.sheetHead,
          h2(ds.sheetTitle, "Documentation"),
          button(
            ds.sheetClose,
            { type: "button", id: "docs-sheet-close", "aria-label": "Close navigator" },
            icon(18, CLOSE),
            { onClick: () => setSheet(false) },
          ),
        ),
        Filter(ds.sheetFilterWrap),
        nav(ds.sheetList, { "aria-label": "Docs sections" }, ...NavGroups()),
      ),
    );
  }

  function Sidebar() {
    return nav(
      ds.sidebar,
      { "aria-label": "Docs navigation" },
      Filter(ds.filterWrap),
      div(ds.navGroups, ...NavGroups()),
    );
  }

  function Rail() {
    return aside(
      ds.rail,
      { "aria-label": "On this page" },
      ...SECTIONS.filter(sec => sec.headings.length).map(sec =>
        div(
          { class: () => cx(ds.toc, activeId === sec.id ? null : ds.hidden).className },
          div(ds.tocTitle, "On this page"),
          ...sec.headings.map(h =>
            a(ds.tocLink, { href: `#${h.id}` }, h.text, {
              onClick: (e) => {
                e.preventDefault();
                jumpTo(h.id);
              },
            })
          ),
        )
      ),
    );
  }

  function Content() {
    return article(
      ds.content,
      { "data-docs-content": "" },
      DocsIntro(),
      SectionBar(),
      ...SECTIONS.map((sec, index) =>
        section(
          ds.section,
          sectionDelay(index),
          { id: sec.id },
          div(
            ds.sectionHead,
            div(
              ds.sectionMeta,
              span(ds.sectionNumber, sectionNumber(index)),
              span(sec.groupTitle),
            ),
            div(
              ds.sectionTitleRow,
              h2(sec.title),
              a(
                ds.sectionAnchor,
                {
                  class: `${ds.sectionAnchor.className} section-anchor`,
                  href: `#${sec.id}`,
                  title: `Link to ${sec.title}`,
                  "aria-label": `Link to ${sec.title}`,
                },
                "#",
                { onClick: () => setActive(sec.id) },
              ),
            ),
          ),
          ...(sec.apiTag ? [
            div(
              ds.apiHeadingRow,
              span(ds.apiTag, sec.apiTag),
              span("Public API"),
            ),
          ] : []),
          ...(sec.apiSig ? [
            div(ds.apiSig, { innerHTML: sec.apiSig }),
          ] : []),
          div({ innerHTML: sec.content }),
          ...(sec.render ? [sec.render()] : []),
          ...(sec.afterContent ? [div({ innerHTML: sec.afterContent })] : []),
        )
      ),
    );
  }

  const page = div(
    ds.layout,
    // Leaving the page with the sheet open (e.g. browser back) must not leave the body locked.
    {
      onDestroy: () => {
        if (!sheetOpen) return;
        document.body.style.overflow = "";
        document.removeEventListener("keydown", onSheetKey);
      },
    },
    DocsProgress(),
    Sidebar(),
    Content(),
    Rail(),
    Sheet(),
  );

  // IntersectionObserver for sidebar active state - only on client
  if (typeof window !== "undefined") {
    requestAnimationFrame(() => {
      const sections = document.querySelectorAll("[data-docs-content] section[id]");
      if (!sections.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && !pinned) setActive(entry.target.id);
          }
        },
        { rootMargin: "-20% 0px -70% 0px" }
      );

      sections.forEach(section => observer.observe(section));
      if (window.location.hash && activeId !== "overview") jumpTo(activeId);

      const setProgress = () => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        doc.style.setProperty("--docs-progress", `${pct * 100}%`);
      };

      setProgress();
      window.addEventListener("scroll", setProgress, { passive: true });
    });
  }

  return page;
}
