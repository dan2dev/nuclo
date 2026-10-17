import type { DataLoader, PageProps, RouteContext } from "nuclo-router";
import { applyLocale, loadLocale, type Locale } from "../i18n/index.ts";
import { css, cx, s } from "../styles.ts";
import { docsIndex, docsText, type DocSection } from "./docs/content.ts";
import { ds, sectionDelay } from "./docs/styles.ts";
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../generated/nuclo-stats.ts";
import { docsSection } from "../docs-state.ts";
import { NucloLogo } from "../components/NucloBrand.ts";
import { allExamples } from "./examples/registry.ts";
import { exampleHref, onOpenExample } from "./examples/open.ts";

// The route's hash, not window.location's: the page builds before the address bar changes.
function getInitialSectionId(hash: string, known: Map<string, DocSection>): string {
  if (typeof window === "undefined") return "overview";
  const id = hash.replace(/^#/, "");
  return known.has(id) ? id : "overview";
}

function PlayIcon() {
  return svgSvg(
    { width: "12", height: "12", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true" },
    pathSvg({ d: "M7 4.5v15l12-7.5z" }),
  );
}

/** Pills that open the examples demonstrating this section, in the examples modal. */
function ExampleLinks(sectionId: string) {
  const L = docsText().LABELS;
  const related = allExamples().filter((ex) => ex.docs === sectionId);
  if (!related.length) return null;
  return div(
    ds.exampleLinks,
    ...related.map((ex) =>
      a(ds.exampleLink, { href: exampleHref(ex.id, "docs"), title: L.openExample(ex.title), onClick: onOpenExample(ex.id, "docs") }, PlayIcon(), L.example(ex.title)),
    ),
  );
}

function sectionNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

// The header breadcrumb reads the active section from docsSection.
function publishSection(sec: DocSection | undefined) {
  docsSection.group = sec?.groupTitle ?? "";
  docsSection.title = sec?.title ?? "";
}

// One observer for the sidebar's active state: a rebuild (a locale switch) replaces it.
let sectionObserver: IntersectionObserver | undefined;

// The hero's mark, built once: a locale switch rebuilds the page over the same svg (see NucloBrand.ts).
const heroMark = NucloLogo({ animate: "visible", class: ds.heroMark, label: () => docsText().LABELS.nucloMark });

const CHEVRON = "M6 9l6 6 6-6";
const CLOSE = "M6 6l12 12 M18 6L6 18";

function icon(size: number, d: string) {
  return svgSvg(
    { width: String(size), height: String(size), viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    pathSvg({ d }),
  );
}

export const load: DataLoader<Locale | null> = (ctx) => loadLocale(ctx.params);

export function DocsPage(ctx: RouteContext, { outlet, data }: PageProps<Locale | null>) {
  // The docs in the URL's locale, fetched by load(). Read per build: a locale switch builds the page again.
  applyLocale(data);
  const { groups: DOC_GROUPS, sections: SECTIONS, byId: SECTION_MAP } = docsIndex();
  const L = docsText().LABELS;
  const DOC_FACTS = [
    { label: L.facts.release, value: `v${NUCLO_VERSION}` },
    { label: L.facts.builders, value: "175" },
    { label: L.facts.gzipped, value: `~${NUCLO_GZIP_KB} KB` },
    { label: L.facts.model, value: L.facts.modelValue },
  ];
  let activeId = getInitialSectionId(ctx.hash, SECTION_MAP);
  publishSection(SECTION_MAP.get(activeId));
  // Docs navigation state, shared by the sidebar and the mobile sheet.
  let filter = "";
  let sheetOpen = false;
  let sheetMounted = false; // stays true while the exit animation plays
  let sheetEl: HTMLElement | undefined;
  let scrimEl: HTMLElement | undefined;
  const toggled: Record<string, boolean> = {}; // groups the user opened/closed; the rest follow the active section

  function setActive(id: string) {
    activeId = id;
    publishSection(SECTION_MAP.get(id));
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
  const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
  const dur = (ms: number) => (matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms);

  // Slides the sheet (from `fromPx` down) and fades the scrim out, then unmounts both.
  function animateOut(fromPx = 0, fade = 1) {
    const sheet = sheetEl, scrim = scrimEl;
    if (!sheet) { sheetMounted = false; update(); return; }
    const opts = { duration: dur(240), easing: EASE, fill: "forwards" as const };
    scrim?.animate([{ opacity: fade }, { opacity: 0 }], opts);
    sheet.animate([{ transform: `translateY(${fromPx}px)` }, { transform: "translateY(100%)" }], opts).finished
      .catch(() => {})
      .then(() => { if (!sheetOpen) { sheetMounted = false; update(); } });
  }

  // Drag down to dismiss: from the grabber/header always, and from the list while it is scrolled to the top.
  // The sheet follows the finger, then closes (far or fast enough) or springs back.
  function enableDrag(zone: HTMLElement) {
    let startY = 0, dy = 0, t0 = 0, active = false;
    const begin = (y: number, t: number) => { active = true; startY = y; dy = 0; t0 = t; };
    const move = (y: number) => {
      if (!active || !sheetEl) return;
      dy = Math.max(0, y - startY);
      sheetEl.style.transform = `translateY(${dy}px)`;
      if (scrimEl) scrimEl.style.opacity = String(1 - dy / sheetEl.offsetHeight);
    };
    const end = (t: number) => {
      if (!active || !sheetEl) return;
      active = false;
      const h = sheetEl.offsetHeight, fade = 1 - dy / h;
      if (dy > h * 0.3 || (dy > 30 && dy / (t - t0) > 0.6)) {
        sheetOpen = false;
        document.documentElement.style.overflow = "";
        document.removeEventListener("keydown", onSheetKey);
        update();
        animateOut(dy, fade);
        document.getElementById("docs-section-bar")?.focus({ preventScroll: true });
      } else {
        sheetEl.animate([{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }], { duration: dur(200), easing: EASE });
        scrimEl?.animate([{ opacity: fade }, { opacity: 1 }], { duration: dur(200) });
        sheetEl.style.transform = "";
        if (scrimEl) scrimEl.style.opacity = "";
      }
    };

    // Grabber + header (touch-action: none, so pointer events are enough).
    zone.addEventListener("pointerdown", (e) => {
      if ((e.target as HTMLElement).closest("button")) return;
      begin(e.clientY, e.timeStamp);
      zone.setPointerCapture(e.pointerId);
    });
    zone.addEventListener("pointermove", (e) => move(e.clientY));
    zone.addEventListener("pointerup", (e) => end(e.timeStamp));
    zone.addEventListener("pointercancel", (e) => end(e.timeStamp));

    // Rest of the sheet: touch events, so we can take over from native scrolling only at scrollTop 0.
    const body = zone.parentElement!;
    let armed = false, y0 = 0;
    body.addEventListener("touchstart", (e) => {
      if (zone.contains(e.target as Node)) return;
      const sc = (e.target as HTMLElement).closest<HTMLElement>("nav");
      armed = !sc || sc.scrollTop <= 0;
      y0 = e.touches[0].clientY;
    }, { passive: true });
    body.addEventListener("touchmove", (e) => {
      if (zone.contains(e.target as Node)) return;
      const y = e.touches[0].clientY;
      if (!active) {
        if (!armed) return;
        const sc = (e.target as HTMLElement).closest<HTMLElement>("nav");
        if (y - y0 > 0 && (!sc || sc.scrollTop <= 0)) begin(y, e.timeStamp);
        else { armed = false; return; }
      }
      e.preventDefault();
      move(y);
    }, { passive: false });
    body.addEventListener("touchend", (e) => { armed = false; end(e.timeStamp); });
    body.addEventListener("touchcancel", (e) => { armed = false; end(e.timeStamp); });

    // Mouse: click-drag anywhere on the sheet (same rule: the list must be at the top). A drag swallows its click.
    let mArmed = false, mId = -1, mY0 = 0;
    body.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0 || zone.contains(e.target as Node) || (e.target as HTMLElement).closest("input")) return;
      const sc = (e.target as HTMLElement).closest<HTMLElement>("nav");
      mArmed = !sc || sc.scrollTop <= 0;
      mId = e.pointerId; mY0 = e.clientY;
    });
    body.addEventListener("pointermove", (e) => {
      if (!mArmed || e.pointerId !== mId) return;
      if (!active) {
        if (e.clientY - mY0 < 4) return;
        begin(e.clientY, e.timeStamp);
        body.setPointerCapture(e.pointerId);
        body.addEventListener("click", (c) => c.stopPropagation(), { capture: true, once: true });
      }
      move(e.clientY);
    });
    const mEnd = (e: PointerEvent) => { if (e.pointerId === mId) { mArmed = false; end(e.timeStamp); } };
    body.addEventListener("pointerup", mEnd);
    body.addEventListener("pointercancel", mEnd);
  }

  function setSheet(open: boolean) {
    sheetOpen = open;
    if (open) sheetMounted = true;
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) document.addEventListener("keydown", onSheetKey);
    else document.removeEventListener("keydown", onSheetKey);
    update();
    if (!open) animateOut();
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
      span(ds.srOnly, L.filterSections),
      input(
        ds.filter,
        { type: "search", placeholder: L.filter, autocomplete: "off", value: () => filter },
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
          div(ds.eyebrow, L.documentation),
          h1(L.title),
          p(ds.lead, L.lead),
        ),
        div(
          ds.heroMarkWrap,
          heroMark,
        ),
      ),
      div(
        ds.quickstart,
        div(
          ds.quickstartCopy,
          span(ds.quickstartLabel, L.quickStart),
          code(ds.quickstartCode, "npm create nuclo@latest"),
        ),
        a(
          ds.quickstartLink,
          { href: "#quick-start" },
          L.quickStartLink,
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
      () => sheetMounted,
      button(ds.scrim, {
        type: "button",
        "aria-label": L.closeNavigator,
        onClick: () => setSheet(false),
        onMount: (el) => {
          scrimEl = el;
          el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur(240), easing: "ease-out" });
          return () => { if (scrimEl === el) scrimEl = undefined; };
        },
      }),
      div(
        ds.sheet,
        {
          role: "dialog", "aria-modal": "true", "aria-label": L.documentation,
          onMount: (el) => {
            sheetEl = el;
            el.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: dur(340), easing: EASE });
            return () => { if (sheetEl === el) sheetEl = undefined; };
          },
        },
        div(
          ds.sheetDrag,
          { onMount: (el) => queueMicrotask(() => enableDrag(el)) },
          div(ds.sheetGrabber, { "aria-hidden": "true" }),
          div(
            ds.sheetHead,
            h2(ds.sheetTitle, L.documentation),
            button(
              ds.sheetClose,
              { type: "button", id: "docs-sheet-close", "aria-label": L.closeNavigator },
              icon(18, CLOSE),
              { onClick: () => setSheet(false) },
            ),
          ),
        ),
        Filter(ds.sheetFilterWrap),
        nav(ds.sheetList, { "aria-label": L.docsSections }, ...NavGroups()),
      ),
    );
  }

  function Sidebar() {
    return nav(
      ds.sidebar,
      { "aria-label": L.docsNavigation },
      Filter(ds.filterWrap),
      div(ds.navGroups, ...NavGroups()),
    );
  }

  function Rail() {
    return aside(
      ds.rail,
      { "aria-label": L.onThisPage },
      ...SECTIONS.filter(sec => sec.headings.length).map(sec =>
        div(
          { class: () => cx(ds.toc, activeId === sec.id ? null : ds.hidden).className },
          div(ds.tocTitle, L.onThisPage),
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
                  title: L.linkTo(sec.title),
                  "aria-label": L.linkTo(sec.title),
                },
                "#",
                { onClick: () => setActive(sec.id) },
              ),
            ),
            ExampleLinks(sec.id),
          ),
          ...(sec.apiTag ? [
            div(
              ds.apiHeadingRow,
              span(ds.apiTag, sec.apiTag),
              span(L.publicApi),
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
    s.container, ds.layout,
    // Leaving the page with the sheet open (e.g. browser back) must not leave the body locked.
    {
      onDestroy: () => {
        if (!sheetOpen) return;
        document.documentElement.style.overflow = "";
        document.removeEventListener("keydown", onSheetKey);
      },
    },
    Sidebar(),
    Content(),
    Rail(),
    Sheet(),
    outlet(), // /docs/example-<id> on a direct load; it renders into the app's modal region
  );

  // IntersectionObserver for sidebar active state - only on client
  if (typeof window !== "undefined") {
    requestAnimationFrame(() => {
      const sections = document.querySelectorAll("[data-docs-content] section[id]");
      if (!sections.length) return;

      sectionObserver?.disconnect();
      const observer = (sectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && !pinned) setActive(entry.target.id);
          }
        },
        { rootMargin: "-20% 0px -70% 0px" }
      ));

      sections.forEach(section => observer.observe(section));
      if (window.location.hash && activeId !== "overview") jumpTo(activeId);
    });
  }

  return page;
}
