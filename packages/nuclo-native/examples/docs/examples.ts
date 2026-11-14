// The examples: every group and example of the site's /examples page, each on its own screen with its live
// preview (where nuclo-native can run it) beside its source, and the "Live" frame the docs embed.
import { PREVIEWS } from "./demos";
import { highlight, type Line } from "./highlight";
import { c, codeBlock, columns, css, data, type Example, grid, kicker, muted, page, para, pill, txt } from "./ui";

type Go = (path: string) => void;

const L = data.examples.labels;
const groups = data.examples.groups;
const all = groups.flatMap((g) => g.examples.map((ex) => ({ ...ex, group: g.title })));
const number = (i: number) => String(i + 1).padStart(2, "0");

export const exampleTitle = (id: string) => all.find((ex) => ex.id === id)?.title ?? L.examples;

/** Why an example has no native preview, by its group. */
const browserOnly: Record<string, string> = {
  SVG: "This example draws with the SVG tag builders. The native hosts render HTML-like views only, so it runs in the browser.",
  Routing: "This example uses nuclo-router, which needs the browser's URL and history. Native apps use nuclo-native/router instead: this app is built with it.",
  Apps: "This app runs full screen in the browser, with pointer events, canvas or SVG the native hosts do not have.",
};

/** The live frame: a "Live" bar over a preview, as the docs show their demos. */
const liveFrame = (head: NodeModLike<"div">[], body: NodeModLike<"div">) =>
  div(
    { style: { borderWidth: 1, borderColor: c.border, borderRadius: 10, overflow: "hidden", backgroundColor: c.card } },
    div(
      { style: { flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 16, paddingRight: 16, paddingTop: 9, paddingBottom: 9, borderBottomWidth: 1, borderColor: c.border } },
      txt("Live", { color: c.primaryInk, fontSize: 12, fontWeight: "bold" }),
      ...head,
    ),
    div({ style: { padding: 18 } }, body),
  );

/** A docs section's demo, captioned with its description, with a link to its example. */
export const Live = (go: Go, id: string) => {
  const ex = all.find((e) => e.id === id);
  const preview = PREVIEWS[id];
  if (!ex || !preview) return null;
  return liveFrame(
    [
      muted(ex.desc, { flex: 1, fontSize: 13 }),
      div({ style: { padding: 4 }, onClick: () => go(`/examples/${id}`) }, txt("Open", { color: c.primaryInk, fontSize: 12, fontWeight: "bold" })),
    ],
    preview(),
  );
};

const card = (go: Go, ex: (typeof all)[number]) =>
  div(
    {
      style: { flexGrow: 1, gap: 8, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.card },
      onClick: () => go(`/examples/${ex.id}`),
    },
    div(
      { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" } },
      txt(number(all.indexOf(ex)), { color: c.primaryInk, fontSize: 13, fontWeight: "bold" }),
      PREVIEWS[ex.id] ? txt("Live", { color: c.primaryInk, fontSize: 11, fontWeight: "bold", backgroundColor: c.primarySoft, borderRadius: 6, paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2 }) : null,
    ),
    txt(ex.title, { fontSize: 17, fontWeight: "bold" }),
    para(ex.desc, { fontSize: 14, flexGrow: 1 }),
    div(
      { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8 } },
      muted(ex.install ? `${ex.group} · + ${ex.install}` : ex.group, { fontSize: 12 }),
      txt("→", { color: c.primaryInk, fontWeight: "bold" }),
    ),
  );

export const ExamplesIndex = (go: Go) => () =>
  page(
    div(
      { style: { gap: 10, paddingTop: 8, paddingBottom: 8 } },
      txt(L.examples, { color: c.primaryInk, fontSize: 14, fontWeight: "bold" }),
      txt(L.title, { fontSize: 32, fontWeight: "bold" }),
      para(L.sub, { fontSize: 16 }),
    ),
    ...groups.map((group) =>
      div(
        { style: { gap: 12, paddingTop: 22, borderTopWidth: 1, borderColor: c.border } },
        div(
          { style: { flexDirection: "row", alignItems: "center", gap: 10 } },
          txt(group.title, { fontSize: 22, fontWeight: "bold" }),
          muted(String(group.examples.length), { fontSize: 12, fontWeight: "bold", backgroundColor: c.secondary, borderRadius: 9999, paddingLeft: 8, paddingRight: 8, paddingTop: 2, paddingBottom: 2 }),
        ),
        para(group.sub),
        grid(260, ...group.examples.map((ex) => card(go, all.find((e) => e.id === ex.id)!))),
      ),
    ),
  );

// Highlighted once per file, when its example first opens.
const highlighted = new Map<string, Line[]>();
const linesOf = (file: { name: string; code: string }) => {
  let lines = highlighted.get(file.code);
  if (!lines) highlighted.set(file.code, (lines = highlight(file.code)));
  return lines;
};

/** The source, one tab per file, as the site's example modal shows it. */
function source(ex: Example) {
  let active = 0;
  return div(
    { style: { gap: 0 } },
    ex.files.length > 1
      ? div(
          { style: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 } },
          ...ex.files.map((file, i) =>
            div(
              {
                style: () => ({ paddingLeft: 12, paddingRight: 12, paddingTop: 7, paddingBottom: 7, borderRadius: 8, backgroundColor: i === active ? c.light : c.secondary }),
                onClick: () => { active = i; update(); },
              },
              span(file.name, { style: () => ({ fontSize: 12, color: i === active ? c.text : c.muted }) }),
            ),
          ),
        )
      : null,
    // Only the open file is built (and highlighted).
    list(() => [ex.files[active]], (file) => codeBlock(file.name, linesOf(file))),
  );
}

const side = css({ large: { flexGrow: 1, flexBasis: 0, minWidth: 0 } });

export const ExampleDetail = (go: Go) => ({ id }: Record<string, string>) => {
  const i = all.findIndex((e) => e.id === id);
  const ex = all[i];
  if (!ex) return page(para(`There is no example called "${id}".`));
  const preview = PREVIEWS[id];
  const prev = all[i - 1];
  const next = all[i + 1];
  return page(
    div(
      { style: { gap: 8 } },
      kicker(number(i), ex.group),
      txt(ex.title, { fontSize: 28, fontWeight: "bold" }),
      para(ex.desc, { fontSize: 16 }),
      div(
        { style: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 } },
        ex.docs ? pill(`Docs: ${data.sections.find((s) => s.id === ex.docs)?.title ?? ex.docs}`, () => go(`/docs/${ex.docs}`)) : null,
        ex.install ? txt(`Separate package: npm install ${ex.install}`, { color: c.muted, fontSize: 13, alignSelf: "center" }) : null,
      ),
    ),
    div(
      columns("large", 20),
      div(side, preview ? liveFrame([muted("Running on native widgets", { fontSize: 13 })], preview()) : div({ style: { backgroundColor: c.secondary, borderRadius: 10, padding: 16 } }, para(browserOnly[ex.group] ?? ""))),
      div(side, source(ex)),
    ),
    div(
      { style: { flexDirection: "row", gap: 12, marginTop: 12 } },
      prev
        ? div({ style: { flex: 1, gap: 4, padding: 16, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, onClick: () => go(`/examples/${prev.id}`) }, muted("Previous", { fontSize: 12 }), txt(`← ${prev.title}`, { fontWeight: "bold" }))
        : div({ style: { flex: 1 } }),
      next
        ? div({ style: { flex: 1, gap: 4, padding: 16, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, alignItems: "flex-end" }, onClick: () => go(`/examples/${next.id}`) }, muted("Next", { fontSize: 12 }), txt(`${next.title} →`, { fontWeight: "bold", color: c.primaryInk }))
        : div({ style: { flex: 1 } }),
    ),
  );
};
