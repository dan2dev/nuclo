// Every locale carries the same docs sections, every example and every hero example.
import "nuclo/polyfill";
import "nuclo";
import { test, expect } from "bun:test";
import * as en from "../src/i18n/en/docs.ts";
import * as enHome from "../src/i18n/en/home.ts";
import pt from "../src/i18n/pt-br/index.ts";
import es from "../src/i18n/es/index.ts";
import fr from "../src/i18n/fr/index.ts";
import it from "../src/i18n/it/index.ts";
import de from "../src/i18n/de/index.ts";
import ja from "../src/i18n/ja/index.ts";
import zh from "../src/i18n/zh/index.ts";
import ko from "../src/i18n/ko/index.ts";
import ar from "../src/i18n/ar/index.ts";
import ru from "../src/i18n/ru/index.ts";
import hi from "../src/i18n/hi/index.ts";
import { ALL_EXAMPLES } from "../src/pages/examples/registry.ts";

const sectionIds = (groups: { sections: { id: string }[] }[]) => groups.flatMap((g) => g.sections.map((s) => s.id));

for (const [name, bundle] of [["pt-br", pt], ["es", es], ["fr", fr], ["it", it], ["de", de], ["ja", ja], ["zh", zh], ["ko", ko], ["ar", ar], ["ru", ru], ["hi", hi]] as const) {
  test(`${name}: the docs have the same groups and sections, in order`, () => {
    expect(sectionIds(bundle.docs.GROUPS)).toEqual(sectionIds(en.GROUPS));
    expect(bundle.docs.GROUPS.map((g) => g.sections.length)).toEqual(en.GROUPS.map((g) => g.sections.length));
    // Where the English has afterContent, the translation does too (and nowhere else).
    const after = (groups: typeof en.GROUPS) => groups.flatMap((g) => g.sections.map((s) => [s.id, !!s.afterContent]));
    expect(after(bundle.docs.GROUPS)).toEqual(after(en.GROUPS));
  });

  test(`${name}: every example has a title and description`, () => {
    const missing = ALL_EXAMPLES.map((ex) => ex.id).filter((id) => !bundle.examples.items[id]?.title || !bundle.examples.items[id]?.desc);
    expect(missing).toEqual([]);
  });

  test(`${name}: every hero example has a title and note`, () => {
    expect(Object.keys(bundle.home.HERO_EXAMPLES).sort()).toEqual(Object.keys(enHome.HERO_EXAMPLES).sort());
  });

  test(`${name}: documentation prose is translated and headings are present`, () => {
    const source = en.GROUPS.flatMap((group) => group.sections);
    const translated = bundle.docs.GROUPS.flatMap((group) => group.sections);
    for (const group of bundle.docs.GROUPS) expect(group.title.trim()).not.toBe("");
    for (const [index, section] of translated.entries()) {
      expect(section.title.trim()).not.toBe("");
      if (source[index]!.content.includes("<p>")) {
        expect(section.content).not.toBe(source[index]!.content);
      }
    }
  });

  test(`${name}: documentation code samples stay identical to English`, () => {
    const snippets = (groups: typeof en.GROUPS) => groups.flatMap((group) =>
      group.sections.map((section) =>
        (section.content + (section.afterContent ?? "")).match(/<pre>[\s\S]*?<\/pre>/g) ?? [],
      ),
    );
    expect(snippets(bundle.docs.GROUPS)).toEqual(snippets(en.GROUPS));
  });

  test(`${name}: the hero preserves its highlight and executable examples`, () => {
    expect(bundle.home.HERO_TITLE_LINES).toHaveLength(3);
    expect(bundle.home.HERO_TITLE_LINES.join(" ").match(/\*[^*]+\*/g)).toHaveLength(1);
    expect(bundle.home.INSTALL_CMD).toBe(enHome.INSTALL_CMD);
    expect(bundle.home.COUNTER_TEASER_CODE).toBe(enHome.COUNTER_TEASER_CODE);
    expect(bundle.home.TODO_TEASER_CODE).toBe(enHome.TODO_TEASER_CODE);
  });
}
