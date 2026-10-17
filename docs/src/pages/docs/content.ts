/**
 * content.ts - the documentation in the current locale.
 *
 * The English text, with the live parts (render, apiSig) every locale shares, is
 * i18n/en/docs.ts; a translation is the same groups with their title, content and
 * afterContent in its language. docsIndex() merges the two by section id and is
 * memoized per locale, so the page reads one array per build.
 */
import * as en from "../../i18n/en/docs.ts";
import { bundle, i18n } from "../../i18n/index.ts";

export interface DocSection {
  id: string;
  groupTitle: string;
  title: string;
  apiTag?: 'fn' | 'type';
  apiSig?: string;
  content: string; // raw HTML inner content, rendered first
  render?: () => NodeModLike<any>; // optional live component, rendered after `content`
  renderText?: string; // raw HTML stand-in for `render` in text exports (llms-full.txt)
  afterContent?: string; // raw HTML, rendered after `render`
}

/** A section as a locale writes it: the text only. */
export interface DocSectionText {
  id: string;
  title: string;
  content: string;
  afterContent?: string;
}

export interface DocGroupText { title: string; sections: DocSectionText[] }

/** The English groups also wire each section's live parts. */
export interface DocGroup extends DocGroupText {
  sections: (DocSectionText & Pick<DocSection, "apiTag" | "apiSig" | "render" | "renderText">)[];
}

/** The docs' text and page labels in the current locale. */
export const docsText = () => bundle()?.docs ?? en;

export type DocHeading = { id: string; text: string };

export interface DocsIndex {
  groups: { title: string; sections: string[] }[];
  sections: (DocSection & { headings: DocHeading[] })[];
  byId: Map<string, DocSection>;
}

const indexes = new Map<string, DocsIndex>();

/** The sections to render in the current locale: the English wiring with the locale's text, built once per locale. */
export function docsIndex(): DocsIndex {
  const cached = indexes.get(i18n.locale);
  if (cached) return cached;
  const text = new Map(docsText().GROUPS.flatMap((g) => g.sections.map((sec) => [sec.id, { ...sec, groupTitle: g.title }] as const)));
  const sections = en.GROUPS.flatMap((g) =>
    g.sections.map((sec) => {
      // The locale's text over the English wiring; a section the locale does not have yet stays English.
      const loc = text.get(sec.id);
      return withHeadings(loc
        ? { ...sec, groupTitle: loc.groupTitle, title: loc.title, content: loc.content, afterContent: loc.afterContent }
        : { ...sec, groupTitle: g.title });
    }),
  );
  const byId = new Map<string, DocSection>(sections.map((sec) => [sec.id, sec]));
  const groups = en.GROUPS.map((g) => ({ title: byId.get(g.sections[0].id)!.groupTitle, sections: g.sections.map((sec) => sec.id) }));
  const index = { groups, sections, byId };
  indexes.set(i18n.locale, index);
  return index;
}

// Ids added to a section's <h3>s, plus those headings for "On this page".
// The text stays plain HTML; the ids exist only in the rendered output.
function withHeadings(sec: DocSection) {
  const headings: DocHeading[] = [];
  const withIds = (html: string) => html.replace(/<h3>([\s\S]*?)<\/h3>/g, (_, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const slug = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const id = `${sec.id}--${slug}`;
    headings.push({ id, text });
    return `<h3 id="${id}">${inner}</h3>`;
  });
  return { ...sec, content: withIds(sec.content), afterContent: sec.afterContent && withIds(sec.afterContent), headings };
}

// The English sections, for the text exports (scripts/generate-llms.ts).
export const DOC_SECTIONS: DocSection[] = en.GROUPS.flatMap((g) => g.sections.map((sec) => ({ ...sec, groupTitle: g.title })));
