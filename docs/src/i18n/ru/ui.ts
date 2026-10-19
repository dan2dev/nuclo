// ui.ts: the chrome's text, in the main bundle. Header, footer, app shell, SEO
// meta and the labels shared by every page. pt/ui.ts and es/ui.ts mirror it.

export const nav = {
  home: "Главная",
  docs: "Документация",
  examples: "Примеры",
  getStarted: "Начать",
  menu: "Меню",
  main: "Основная навигация",
  openMenu: "Открыть меню",
  closeMenu: "Закрыть меню",
  nucloHome: "Главная Nuclo",
  nucloOnGitHub: "Nuclo на GitHub",
  opensInNewTab: " (открывается в новой вкладке)",
  switchTheme: "Сменить цветовую тему",
  language: "Язык",
};

export const footer = {
  tagline: "UI-runtime, где всё явно: обычные функции, изменяемое состояние и один вызов между вашими данными и DOM.",
  builtWith: "Этот сайт создан с помощью Nuclo.",
  explore: "Обзор",
  documentation: "Документация",
  examples: "Примеры",
  readme: "README",
  project: "Проект",
  github: "GitHub",
  license: "Лицензия MIT",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · Лицензия MIT",
};

export const app = {
  failedToLoad: "Не удалось загрузить страницу",
  loadingLanguage: "Загрузка языка…",
  notFound: "Страница не найдена",
  notFoundHint: "По этому адресу ничего нет.",
  goHome: "На главную",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "Превью",
  code: "Код",
  copy: "Копировать",
  copied: "✓ Скопировано",
  copyToClipboard: "Копировать в буфер обмена",
  live: "Вживую",
  openFullScreen: "Открыть этот пример на весь экран",
  open: "Открыть ↗",
  readTheDocs: "Читать документацию →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo — лёгкий DOM-фреймворк с явными обновлениями",
      description: "Nuclo — лёгкая DOM-библиотека для TypeScript без зависимостей. Собирайте UI из функций, меняйте обычное состояние и вызывайте update(). Никакого virtual DOM, прокси и сигналов.",
      keywords: "nuclo, DOM-фреймворк, явные обновления, изменяемое состояние, javascript, typescript, UI-фреймворк, лёгкий",
    },
    "apps/:id": {
      title: "Отдельные приложения — примеры Nuclo",
      description: "Интерактивные приложения на Nuclo, развёрнутые на весь экран.",
    },
    desktop: {
      title: "Nuclo OS — рабочий стол",
      description: "Рабочий стол с настоящими приложениями: файлы, заметки, терминал, калькулятор, таймер, канбан-доска, финансы с графиками и таблицей, календарь. Виртуальная файловая система живёт прямо в браузере.",
    },
    docs: {
      title: "Документация Nuclo — руководство и справочник API",
      description: "Документация Nuclo: установка, билдеры тегов, явный update(), when() и list(), события, жизненный цикл, SSR и гидратация, типизированный CSS-in-TS и полный справочник по API.",
      keywords: "документация nuclo, справочник API, быстрый старт, update, list, when, on",
    },
    examples: {
      title: "Примеры Nuclo — счётчик, список задач, поиск и стили",
      description: "Живые примеры Nuclo с исходным кодом: счётчик, список задач, поиск с мгновенным фильтром и типизированные стили на CSS-in-TS.",
      keywords: "примеры nuclo, счётчик, список задач, поиск, css-in-ts, живые демо",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} — примеры Nuclo`,
  exampleDescription: (desc: string) => `${desc} Живой пример Nuclo с исходным кодом.`,
  exampleKeywords: (title: string) => `пример nuclo, ${title.toLowerCase()}, живая демонстрация, исходный код`,
};
