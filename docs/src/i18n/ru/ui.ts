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
  theme: "Тема",
  themes: { light: "Светлая", dark: "Тёмная", system: "Системная" },
  language: "Язык",
};

export const footer = {
  tagline: "Среда выполнения UI с явными обновлениями. Обычные функции, изменяемое состояние и один вызов между вашими данными и DOM.",
  builtWith: "Этот сайт создан с помощью Nuclo.",
  explore: "Обзор",
  documentation: "Документация",
  examples: "Примеры",
  readme: "README",
  project: "Проект",
  github: "GitHub",
  license: "Лицензия MIT",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · MIT License",
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
  preview: "Предпросмотр",
  code: "Код",
  copy: "Копировать",
  copied: "✓ Скопировано",
  copyToClipboard: "Копировать в буфер обмена",
  live: "Демонстрация",
  openFullScreen: "Открыть этот пример на весь экран",
  open: "Открыть ↗",
  readTheDocs: "Читать документацию →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - Лёгкий DOM-фреймворк с явными обновлениями",
      description: "Nuclo — лёгкая библиотека DOM для TypeScript без зависимостей. Создавайте UI с помощью функций, изменяйте обычное состояние и вызывайте update(). Без виртуального DOM, прокси и сигналов.",
      keywords: "nuclo, DOM-фреймворк, значения на основе состояния, явные обновления, изменяемое состояние, javascript, typescript, UI-фреймворк, лёгкий",
    },
    "apps/:id": {
      title: "Автономные приложения - Примеры Nuclo",
      description: "Интерактивные примеры приложений Nuclo в рабочей области на весь браузер.",
    },
    desktop: {
      title: "Nuclo OS - Рабочий стол",
      description: "Автономный рабочий стол с работающими приложениями: файлы, заметки, терминал, калькулятор, таймер, канбан-доска, финансы с графиками и электронной таблицей, календарь. Имитируемая файловая система сохраняется в браузере.",
    },
    docs: {
      title: "Документация Nuclo - Руководство и справочник API",
      description: "Документация Nuclo: установка, построители тегов, явный update(), when() и list(), события, жизненный цикл, SSR и гидратация, типизированный CSS-in-TS и полный справочник API.",
      keywords: "документация nuclo, справочник API, начало работы, update, list, when, on",
    },
    examples: {
      title: "Примеры Nuclo - Счётчик, список задач, поиск и стили",
      description: "Живые примеры Nuclo с исходным кодом: счётчик, список задач, поисковый фильтр в реальном времени и типизированные стили CSS-in-TS.",
      keywords: "примеры nuclo, счётчик, задачи, поисковый фильтр, css-in-ts, живые демонстрации",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Примеры Nuclo`,
  exampleDescription: (desc: string) => `${desc} Живой пример Nuclo с исходным кодом.`,
  exampleKeywords: (title: string) => `пример nuclo, ${title.toLowerCase()}, живая демонстрация, исходный код`,
};
