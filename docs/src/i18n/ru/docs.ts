import type { DocGroupText } from "../../pages/docs/content.ts";
import { GROUPS_1 } from "./docs-1.ts";
import { GROUPS_2 } from "./docs-2.ts";

export const GROUPS: DocGroupText[] = [...GROUPS_1, ...GROUPS_2];

// ── The docs page's chrome ──
export const LABELS = {
  documentation: "Документация",
  title: "Документация Nuclo",
  lead: "Практический справочник по установке Nuclo, созданию UI с явными обновлениями, типизированным стилям CSS и серверному рендерингу HTML.",
  quickStart: "Быстрый старт",
  quickStartLink: "Быстрый старт",
  nucloMark: "Знак Nuclo",
  facts: { release: "Текущий выпуск", builders: "Билдеры тегов", gzipped: "Ядро, gzip", model: "Модель выполнения", modelValue: "Явная" },
  filterSections: "Фильтровать разделы",
  filter: "Фильтр",
  closeNavigator: "Закрыть навигатор",
  docsSections: "Разделы документации",
  docsNavigation: "Навигация по документации",
  onThisPage: "На этой странице",
  publicApi: "Публичный API",
  linkTo: (title: string) => `Ссылка на ${title}`,
  openExample: (title: string) => `Открыть пример «${title}»`,
  example: (title: string) => `Пример: ${title}`,
};
