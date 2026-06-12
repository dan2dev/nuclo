import { DOC_GROUPS, DOC_SECTIONS, SECTION_MAP } from "./docs/content.ts";

const DOC_FACTS = [
  { label: "Current release", value: "v0.2.1" },
  { label: "Tag builders", value: "175" },
  { label: "Gzipped ESM", value: "~10.0 KB" },
  { label: "Runtime model", value: "Explicit" },
];

function getInitialSectionId(): string {
  if (typeof window === "undefined") return "overview";
  const id = window.location.hash.replace(/^#/, "");
  return SECTION_MAP.has(id) ? id : "overview";
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

  function SectionLink(id: string, className: string) {
    const sec = SECTION_MAP.get(id);
    if (!sec) return span();

    return a(
      {
        class: () => `${className}${activeId === id ? " active" : ""}`,
        href: `#${id}`,
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
      { class: "docs-hero" },
      div({ class: "docs-eyebrow" }, "Documentation"),
      h1("Nuclo documentation"),
      p(
        { class: "docs-lead" },
        "A practical reference for installing Nuclo, building with explicit updates, styling with atomic CSS, and rendering server-side HTML.",
      ),
      div(
        { class: "docs-meta-grid" },
        ...DOC_FACTS.map(({ label, value }) =>
          div(
            { class: "docs-meta-card" },
            div({ class: "docs-meta-value" }, value),
            div({ class: "docs-meta-label" }, label),
          )
        ),
      ),
    );
  }

  function MobileToc() {
    return nav(
      { class: "docs-mobile-toc", "aria-label": "Docs sections" },
      ...DOC_SECTIONS.map(sec => SectionLink(sec.id, "docs-mobile-link")),
    );
  }

  function Sidebar() {
    return nav(
      { class: "docs-sidebar", "aria-label": "Docs navigation" },
      div(
        { class: "docs-sidebar-head" },
        div({ class: "docs-sidebar-kicker" }, "Nuclo"),
        div({ class: "docs-sidebar-title" }, "Docs"),
      ),
      ...DOC_GROUPS.map(group =>
        div(
          { class: "sidebar-group" },
          div({ class: "sidebar-group-title" }, group.title),
          ...group.sections.map(id => SectionLink(id, "sidebar-link")),
        )
      ),
    );
  }

  function Content() {
    return article(
      { class: "docs-content" },
      DocsIntro(),
      MobileToc(),
      ...DOC_SECTIONS.map(sec =>
        section(
          { id: sec.id, class: `docs-section${sec.apiTag ? " docs-api-section" : ""}` },
          div({ class: "docs-section-kicker" }, sec.groupTitle),
          h2(sec.title),
          ...(sec.apiTag ? [
            div(
              { class: "api-heading-row" },
              span({ class: `api-tag ${sec.apiTag}-tag` }, sec.apiTag),
              span({ class: "api-label" }, "Public API"),
            ),
          ] : []),
          ...(sec.apiSig ? [
            div({ class: "api-sig", innerHTML: sec.apiSig }),
          ] : []),
          div({ innerHTML: sec.content }),
        )
      ),
    );
  }

  const page = div(
    { class: "docs-layout" },
    Sidebar(),
    Content(),
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
    });
  }

  return page;
}
