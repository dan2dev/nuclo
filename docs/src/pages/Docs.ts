import { cn } from "../styles.ts";
import { DOC_GROUPS, DOC_SECTIONS, SECTION_MAP } from "./docs/content.ts";

export function DocsPage() {
  let activeId = "overview";

  function setActive(id: string) {
    activeId = id;
    update();
  }

  // Build sidebar
  function Sidebar() {
    return nav(
      { class: "docs-sidebar" },
      ...DOC_GROUPS.map(group =>
        div(
          { class: "sidebar-group" },
          div({ class: "sidebar-group-title" }, group.title),
          ...group.sections.map(id => {
            const sec = SECTION_MAP.get(id);
            if (!sec) return span();
            return a(
              {
                class: () => `sidebar-link${activeId === id ? " active" : ""}`,
                href: `#${id}`,
              },
              sec.title,
              on("click", (e) => {
                e.preventDefault();
                setActive(id);
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }),
            );
          }),
        )
      ),
    );
  }

  // Build content area
  function Content() {
    return article(
      { class: "docs-content" },
      ...DOC_SECTIONS.map(sec =>
        section(
          { id: sec.id },
          // Section heading
          sec.id === "overview"
            ? h1(sec.title)
            : h2(sec.title),
          // API tag + signature
          ...(sec.apiTag ? [
            div(
              cn(display("flex").alignItems("center").gap("8px").margin("12px 0 8px")),
              span({ class: `api-tag ${sec.apiTag}-tag` }, sec.apiTag),
            ),
          ] : []),
          ...(sec.apiSig ? [
            div({ class: "api-sig", innerHTML: sec.apiSig }),
          ] : []),
          // Main content (raw HTML)
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
    });
  }

  return page;
}
