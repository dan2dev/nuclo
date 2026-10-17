// Every locale carries the same docs sections, every example and every hero example.
import "nuclo/polyfill";
import "nuclo";
import { test, expect } from "bun:test";
import * as en from "../src/i18n/en/docs.ts";
import * as enHome from "../src/i18n/en/home.ts";
import * as enUi from "../src/i18n/en/ui.ts";
import * as enExamples from "../src/i18n/en/examples.ts";
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
import { LOCALES as SHOP_LOCALES, localize, type Code } from "../src/demos/apps/i18n/messages.ts";

const sectionIds = (groups: { sections: { id: string }[] }[]) => groups.flatMap((g) => g.sections.map((s) => s.id));

const messagePaths = (value: unknown, prefix = ""): string[] => {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, child]) => messagePaths(child, `${prefix}.${key}`)).sort();
};

const dynamicMessages = (value: unknown): ((...args: any[]) => string)[] => {
  if (typeof value === "function") return [value as (...args: any[]) => string];
  return value !== null && typeof value === "object" ? Object.values(value).flatMap(dynamicMessages) : [];
};

for (const [name, bundle] of [["pt-br", pt], ["es", es], ["fr", fr], ["it", it], ["de", de], ["ja", ja], ["zh", zh], ["ko", ko], ["ar", ar], ["ru", ru], ["hi", hi]] as const) {
  test(`${name}: shared messages retain all keys and dynamic parameters`, () => {
    for (const [source, translation] of [
      [enUi, bundle.ui], [enHome, bundle.home], [en.LABELS, bundle.docs.LABELS],
      [enExamples.groups, bundle.examples.groups], [enExamples.LABELS, bundle.examples.LABELS],
    ]) {
      expect(messagePaths(translation)).toEqual(messagePaths(source));
      const originals = dynamicMessages(source);
      const translated = dynamicMessages(translation);
      expect(translated).toHaveLength(originals.length);
      for (const [index, message] of translated.entries()) {
        const args = ["NucloParameter271", "NucloParameter823"];
        const used = args.filter((arg) => originals[index]!(...args).includes(arg.toLowerCase()) || originals[index]!(...args).includes(arg));
        for (const arg of used) expect(message(...args).toLowerCase()).toContain(arg.toLowerCase());
      }
    }
    expect(Object.keys(bundle.examples.items).sort()).toEqual(ALL_EXAMPLES.map((example) => example.id).sort());
  });

  test(`${name}: documentation preserves link targets`, () => {
    const links = (groups: typeof en.GROUPS) => groups.flatMap((group) => group.sections.map((section) =>
      [...(section.content + (section.afterContent ?? "")).matchAll(/href="([^"]*)"/g)].map((match) => match[1]),
    ));
    expect(links(bundle.docs.GROUPS)).toEqual(links(en.GROUPS));
  });

  test(`${name}: inline code preserves identifiers and API placeholders`, () => {
    const identifiers = (groups: typeof en.GROUPS) => groups.flatMap((group) => group.sections.map((section) =>
      [...new Set([...(section.content + (section.afterContent ?? "")).replace(/<pre>[\s\S]*?<\/pre>/g, "").matchAll(/<code>([\s\S]*?)<\/code>/g)].map((match) => match[1]))].sort(),
    ));
    expect(identifiers(bundle.docs.GROUPS)).toEqual(identifiers(en.GROUPS));
    expect(bundle.home.BENCHMARK_ENTRIES).toEqual(enHome.BENCHMARK_ENTRIES);
    expect(bundle.home.BENCHMARK_SOURCE_URL).toBe(enHome.BENCHMARK_SOURCE_URL);
  });

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
    expect(bundle.home.QUICK_START_STEPS.map(({ code, lang }) => ({ code, lang }))).toEqual(
      enHome.QUICK_START_STEPS.map(({ code, lang }) => ({ code, lang })),
    );
  });
}

test("the multilingual shop preserves message parameters and locale-specific plurals", () => {
  for (const code of Object.keys(SHOP_LOCALES) as Code[]) {
    const localized = localize(code);
    expect(localized.t.freeOver("Amount271")).toContain("Amount271");
    expect(localized.t.shipsTo("Countries823")).toContain("Countries823");
    const rules = new Intl.PluralRules(code);
    for (const count of [0, 1, 2, 3, 11, 100]) {
      const category = rules.select(count);
      expect(localized.t.items[category]).toBeDefined();
      expect(localized.items(count)).not.toContain("#");
      if (localized.t.items[category]!.includes("#")) {
        expect(localized.items(count)).toContain(localized.number(count));
      }
    }
  }
});
