// ui.ts: the chrome's text, in the main bundle. Header, footer, app shell, SEO
// meta and the labels shared by every page. pt/ui.ts and es/ui.ts mirror it.

export const nav = {
  home: "الرئيسية",
  docs: "التوثيق",
  examples: "الأمثلة",
  getStarted: "ابدأ الآن",
  menu: "القائمة",
  main: "التنقل الرئيسي",
  openMenu: "فتح القائمة",
  closeMenu: "إغلاق القائمة",
  nucloHome: "صفحة Nuclo الرئيسية",
  nucloOnGitHub: "Nuclo على GitHub",
  opensInNewTab: " (يفتح في علامة تبويب جديدة)",
  switchTheme: "تبديل سمة الألوان",
  language: "اللغة",
};

export const footer = {
  tagline: "runtime واجهات صريح لا يخفي شيئًا: دوال عادية، وstate قابلة للتعديل المباشر، واستدعاء واحد فقط بين بياناتك والـ DOM.",
  builtWith: "هذا الموقع نفسه مبني بـ Nuclo.",
  explore: "استكشف",
  documentation: "التوثيق",
  examples: "الأمثلة",
  readme: "README",
  project: "المشروع",
  github: "GitHub",
  license: "رخصة MIT",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · MIT License",
};

export const app = {
  failedToLoad: "تعذّر تحميل الصفحة",
  loadingLanguage: "جارٍ تحميل اللغة…",
  notFound: "الصفحة غير موجودة",
  notFoundHint: "لا يوجد شيء على هذا العنوان.",
  goHome: "العودة إلى الرئيسية",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "معاينة",
  code: "الكود",
  copy: "نسخ",
  copied: "✓ تم النسخ",
  copyToClipboard: "نسخ إلى الحافظة",
  live: "مباشر",
  openFullScreen: "افتح المثال بملء الشاشة",
  open: "فتح ↗",
  readTheDocs: "اقرأ التوثيق →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - مكتبة DOM خفيفة بتحديثات صريحة",
      description: "Nuclo مكتبة DOM خفيفة لـ TypeScript بلا أي dependencies. ابنِ واجهتك بدوال عادية، وعدّل الـ state مباشرة، ثم استدعِ update(). بلا virtual DOM ولا proxies ولا signals.",
      keywords: "nuclo, DOM framework, تحديثات صريحة, state قابلة للتعديل, قيم تعتمد على state, javascript, typescript, مكتبة واجهات, خفيف",
    },
    "apps/:id": {
      title: "تطبيقات كاملة - أمثلة Nuclo",
      description: "تطبيقات Nuclo تفاعلية تعمل في مساحة عمل تملأ نافذة المتصفح.",
    },
    desktop: {
      title: "Nuclo OS - سطح مكتب كامل",
      description: "سطح مكتب قائم بذاته وتطبيقاته تعمل فعلًا: الملفات، الملاحظات، الطرفية، الآلة الحاسبة، المؤقت، لوحة Kanban، تطبيق مالي بمخططات، جدول بيانات، وتقويم. وله نظام ملفات محاكى يُحفظ في متصفحك.",
    },
    docs: {
      title: "توثيق Nuclo - الدليل ومرجع API",
      description: "توثيق Nuclo: التثبيت، ودوال بناء الوسوم، واستدعاء update() الصريح، وwhen() وlist()، والأحداث، ودورة الحياة، وSSR والـ hydration، وCSS-in-TS بأنواع محكمة، ومرجع الـ API كاملًا.",
      keywords: "توثيق nuclo, مرجع API, البدء السريع, update, list, when, on",
    },
    examples: {
      title: "أمثلة Nuclo - عدّاد وقائمة مهام وبحث وتنسيق",
      description: "أمثلة Nuclo حيّة مع الكود المصدري: عدّاد، وقائمة مهام، وبحث فوري، وتنسيق بـ CSS-in-TS بأنواع محكمة.",
      keywords: "أمثلة nuclo, عدّاد, قائمة مهام, مرشح بحث, css-in-ts, عروض مباشرة",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - أمثلة Nuclo`,
  exampleDescription: (desc: string) => `${desc} مثال Nuclo حي مع كوده المصدري.`,
  exampleKeywords: (title: string) => `مثال nuclo, ${title.toLowerCase()}, عرض حي, كود مصدري`,
};
