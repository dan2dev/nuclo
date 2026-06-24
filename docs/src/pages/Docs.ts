import { css, cx } from "../styles.ts";
import { DOC_GROUPS, DOC_SECTIONS, SECTION_MAP } from "./docs/content.ts";
import { ds, sectionDelay } from "./docs/styles.ts";

const DOC_FACTS = [
  { label: "Current release", value: "v0.2.6" },
  { label: "Tag builders", value: "175" },
  { label: "Gzipped ESM", value: "~10.0 KB" },
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

export function DocsPage() {
  let activeId = getInitialSectionId();

  function setActive(id: string) {
    activeId = id;
    update();
  }

  function scrollToSection(id: string) {
    if (typeof document === "undefined") return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function SectionLink(id: string, baseStyle: ReturnType<typeof css>, activeStyle: ReturnType<typeof css>) {
    const sec = SECTION_MAP.get(id);
    if (!sec) return span();

    return a(
      baseStyle,
      {
        class: () => cx(baseStyle, activeId === id ? activeStyle : null).className,
        href: `#${id}`,
        "aria-current": () => activeId === id ? "location" : undefined,
      },
      sec.title,
      on("click", (e) => {
        e.preventDefault();
        window.history.replaceState(null, "", `#${id}`);
        setActive(id);
        scrollToSection(id);
      }),
    );
  }

  function DocsIntro() {
    return header(
      ds.hero,
      div(ds.eyebrow, "Documentation"),
      h1("Nuclo documentation"),
      p(
        ds.lead,
        "A practical reference for installing Nuclo, building with explicit updates, styling with atomic CSS, and rendering server-side HTML.",
      ),
      div(
        ds.quickstart,
        div(
          ds.quickstartCopy,
          span(ds.quickstartLabel, "Quick start"),
          code(ds.quickstartCode, "bun add nuclo"),
        ),
        a(
          ds.quickstartLink,
          { href: "#installation" },
          "Installation",
          on("click", (e) => {
            e.preventDefault();
            window.history.replaceState(null, "", "#installation");
            setActive("installation");
            scrollToSection("installation");
          }),
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

  function MobileToc() {
    return nav(
      ds.mobileToc,
      { "aria-label": "Docs sections" },
      ...DOC_SECTIONS.map(sec => SectionLink(sec.id, ds.mobileLink, ds.mobileLinkActive)),
    );
  }

  function Sidebar() {
    return nav(
      ds.sidebar,
      { "aria-label": "Docs navigation" },
      div(
        ds.sidebarHead,
        div(ds.sidebarKicker, "Nuclo"),
        div(ds.sidebarTitle, "Docs"),
      ),
      ...DOC_GROUPS.map(group =>
        div(
          ds.sidebarGroup,
          div(ds.sidebarGroupTitle, group.title),
          ...group.sections.map(id => SectionLink(id, ds.sidebarLink, ds.sidebarLinkActive)),
        )
      ),
    );
  }

  function Rail() {
    return aside(
      ds.rail,
      { "aria-label": "Docs shortcuts" },
      div(
        ds.railCard,
        div(ds.railKicker, "Current section"),
        div(ds.railTitle, () => SECTION_MAP.get(activeId)?.title ?? "Overview"),
        div(ds.railGroup, () => SECTION_MAP.get(activeId)?.groupTitle ?? "Introduction"),
      ),
      nav(
        ds.railCard,
        ds.railNav,
        { "aria-label": "Common documentation sections" },
        div(ds.railKicker, "Jump to"),
        SectionLink("installation", ds.railLink, ds.railLinkActive),
        SectionLink("explicit-updates", ds.railLink, ds.railLinkActive),
        SectionLink("api-update", ds.railLink, ds.railLinkActive),
        SectionLink("api-styling", ds.railLink, ds.railLinkActive),
        SectionLink("best-practices", ds.railLink, ds.railLinkActive),
      ),
    );
  }

  function Content() {
    return article(
      ds.content,
      DocsIntro(),
      MobileToc(),
      ...DOC_SECTIONS.map((sec, index) =>
        section(
          ds.section,
          sectionDelay(index),
          { id: sec.id },
          div(
            ds.sectionHead,
            div(
              ds.sectionMeta,
              span(ds.sectionNumber, sectionNumber(index)),
              span(ds.sectionKicker, sec.groupTitle),
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
                on("click", () => setActive(sec.id)),
              ),
            ),
          ),
          ...(sec.apiTag ? [
            div(
              ds.apiHeadingRow,
              span(ds.apiTag, sec.apiTag === "fn" ? ds.apiTagFn : ds.apiTagType, sec.apiTag),
              span(ds.apiLabel, "Public API"),
            ),
          ] : []),
          ...(sec.apiSig ? [
            div(ds.apiSig, { innerHTML: sec.apiSig }),
          ] : []),
          div({ innerHTML: sec.content }),
        )
      ),
    );
  }

  const page = div(
    ds.layout,
    DocsProgress(),
    Sidebar(),
    Content(),
    Rail(),
  );

  // IntersectionObserver for sidebar active state — only on client
  if (typeof window !== "undefined") {
    requestAnimationFrame(() => {
      const sections = document.querySelectorAll(".docs-content section[id]");
      if (!sections.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              activeId = entry.target.id;
              update();
            }
          }
        },
        { rootMargin: "-20% 0px -70% 0px" }
      );

      sections.forEach(section => observer.observe(section));
      if (window.location.hash && activeId !== "overview") scrollToSection(activeId);

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
