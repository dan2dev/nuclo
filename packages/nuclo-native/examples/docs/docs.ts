// The documentation: the index of every section, grouped and filterable, and one screen per section.
import { Live } from "./examples";
import { block, c, card, codeBlock, columns, css, data, grid, kicker, page, para, txt } from "./ui";

const D = data.docs;
const sections = data.sections;
const number = (i: number) => String(i + 1).padStart(2, "0");
const groups = [...new Set(sections.map((s) => s.group))];

export const sectionTitle = (id: string) => sections.find((s) => s.id === id)?.title ?? D.documentation;

let filter = "";
const matches = (s: (typeof sections)[number]) => {
  const q = filter.trim().toLowerCase();
  return !q || s.title.toLowerCase().includes(q) || s.group.toLowerCase().includes(q);
};

const facts = [
  { value: `v${data.version}`, label: D.facts.release },
  { value: "175", label: D.facts.builders },
  { value: `${data.gzip} KB`, label: D.facts.gzipped },
  { value: D.facts.modelValue, label: D.facts.model },
];

const Intro = (go: (path: string) => void) =>
  div(
    { style: { backgroundColor: c.card, borderRadius: 28, padding: 24, paddingTop: 28, paddingBottom: 28, gap: 12 } },
    txt(D.documentation.toUpperCase(), { color: c.primary, fontSize: 12, fontWeight: "bold" }),
    txt(D.title, { fontSize: 34, fontWeight: "bold" }),
    para(D.lead, { fontSize: 17 }),
    div(
      { style: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", backgroundColor: c.secondary, borderRadius: 16, padding: 14, marginTop: 10 } },
      div(
        { style: { flexDirection: "row", gap: 12, alignItems: "center" } },
        txt(D.quickStart.toUpperCase(), { color: c.muted, fontSize: 11, fontWeight: "bold" }),
        div({ style: { backgroundColor: c.code, borderRadius: 4, paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2 } }, txt("npm create nuclo@latest", { fontSize: 13 })),
      ),
      div(
        { style: { borderRadius: 6, padding: 8, backgroundColor: c.primarySoft }, onClick: () => go("/docs/quick-start") },
        txt(`${D.quickStartLink} →`, { color: c.primary, fontSize: 13, fontWeight: "bold" }),
      ),
    ),
    grid(
      130,
      ...facts.map((fact) =>
        div(
          { style: { backgroundColor: c.secondary, borderRadius: 14, padding: 14, gap: 4 } },
          txt(fact.value, { fontSize: 16, fontWeight: "bold" }),
          txt(fact.label, { color: c.muted, fontSize: 12 }),
        ),
      ),
    ),
  );

const sectionRow = (go: (path: string) => void) => (s: (typeof sections)[number]) =>
  div(
    {
      style: { flexDirection: "row", gap: 12, alignItems: "center", paddingLeft: 12, paddingRight: 12, paddingTop: 11, paddingBottom: 11, borderRadius: 8 },
      onClick: () => go(`/docs/${s.id}`),
    },
    txt(number(sections.indexOf(s)), { color: c.primaryInk, fontSize: 13, fontWeight: "bold", width: 22 }),
    txt(s.title, { flex: 1, color: c.dim }),
    s.api ? txt(s.api, { color: c.muted, fontSize: 12 }) : null,
    txt("›", { color: c.muted, fontSize: 18 }),
  );

const groupGrid = css({ medium: { flexDirection: "row", flexWrap: "wrap", gap: 16 } });
const groupCell = css({ gap: 2, medium: { flexGrow: 1, flexBasis: 300, minWidth: 300 } });

export const DocsIndex = (go: (path: string) => void) => () =>
  page(
    Intro(go),
    input({
      placeholder: D.filter,
      value: () => filter,
      style: { borderWidth: 1, borderColor: c.border, borderRadius: 10, backgroundColor: c.secondary, color: c.text, fontSize: 15, padding: 12 },
      onInput: (e) => {
        filter = (e.target as HTMLInputElement).value;
        update();
      },
    }),
    // One group per column from a tablet width up, as many columns as fit.
    div(
      groupGrid,
      ...groups.map((group) =>
        when(
          () => sections.some((s) => s.group === group && matches(s)),
          div(
            groupCell,
            txt(group, { fontSize: 13, fontWeight: "bold", paddingLeft: 12, paddingTop: 8, paddingBottom: 4 }),
            list(() => sections.filter((s) => s.group === group && matches(s)), sectionRow(go)),
          ),
        ),
      ),
    ),
    when(() => !sections.some(matches), para(() => `No sections match “${filter}”.`, { paddingLeft: 12 })),
  );

/** The site's sidebar, from a desktop width: every section by group, the open one marked. */
const sidebar = (go: (path: string) => void, open: string) =>
  div(
    sidebarStyle,
    ...groups.map((group) =>
      div(
        { style: { gap: 1 } },
        txt(group, { fontSize: 13, fontWeight: "bold", paddingLeft: 10, paddingTop: 10, paddingBottom: 4 }),
        ...sections
          .filter((s) => s.group === group)
          .map((s) =>
            div(
              { style: { paddingLeft: 10, paddingRight: 10, paddingTop: 6, paddingBottom: 6, borderRadius: 6, backgroundColor: s.id === open ? c.secondary : "transparent" }, onClick: () => s.id !== open && go(`/docs/${s.id}`) },
              txt(s.title, { fontSize: 14, color: s.id === open ? c.primaryInk : c.dim, fontWeight: s.id === open ? "bold" : "normal" }),
            ),
          ),
      ),
    ),
  );

const sidebarStyle = css({ display: "none", large: { display: "flex", width: 228, flexShrink: 0, paddingRight: 16, borderRight: `1px solid ${c.border}` } });
const article = css({ gap: 16, large: { flexGrow: 1, flexBasis: 0, minWidth: 0, maxWidth: 840 } });

export const Section = (go: (path: string) => void) => ({ id }: Record<string, string>) => {
  const i = sections.findIndex((s) => s.id === id);
  const s = sections[i];
  if (!s) return page(para("This section does not exist."));
  const next = sections[i + 1];
  return page(
    div(
      columns("large", 34),
      sidebar(go, id),
      div(
        article,
        div(
          { style: { gap: 8 } },
          kicker(number(i), s.group),
          txt(s.title, { fontSize: 28, fontWeight: "bold" }),
        ),
        s.sig
          ? div(
              { style: { gap: 10 } },
              div({ style: { flexDirection: "row", gap: 8 } }, txt(s.api ?? "fn", { color: c.muted, fontSize: 13 }), txt(D.publicApi, { color: c.muted, fontSize: 13 })),
              codeBlock("", s.sig),
            )
          : null,
        ...s.blocks.map((b) => (b.t === "live" ? Live(go, b.id) : block(b))),
        next
          ? card(
              { gap: 4, marginTop: 24 },
              { onClick: () => go(`/docs/${next.id}`) },
              txt("Next", { color: c.muted, fontSize: 13 }),
              txt(`${next.title} →`, { color: c.primaryInk, fontSize: 17, fontWeight: "bold" }),
            )
          : null,
      ),
    ),
  );
};
