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
  tagline: "بيئة تشغيل لواجهات المستخدم بتحديثات صريحة. دوال عادية وحالة قابلة للتغيير، واستدعاء واحد يصل بياناتك بـ DOM.",
  builtWith: "بُني هذا الموقع باستخدام Nuclo.",
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
  notFoundHint: "لا توجد صفحة على هذا العنوان.",
  goHome: "الانتقال إلى الرئيسية",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "معاينة",
  code: "الكود",
  copy: "نسخ",
  copied: "✓ تم النسخ",
  copyToClipboard: "نسخ إلى الحافظة",
  live: "مباشر",
  openFullScreen: "فتح هذا المثال بملء الشاشة",
  open: "فتح ↗",
  readTheDocs: "اقرأ التوثيق →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - إطار DOM خفيف بتحديثات صريحة",
      description: "Nuclo مكتبة DOM خفيفة لـ TypeScript بلا اعتماديات خارجية. ابنِ الواجهة بدوال، وغيّر الحالة العادية، ثم استدعِ update(). بلا DOM افتراضي أو بروكسيات أو إشارات.",
      keywords: "nuclo, إطار DOM, قيم تعتمد على الحالة, تحديثات صريحة, حالة قابلة للتغيير, javascript, typescript, إطار واجهات مستخدم, خفيف",
    },
    "apps/:id": {
      title: "تطبيقات مستقلة - أمثلة Nuclo",
      description: "أمثلة تفاعلية لتطبيقات Nuclo ضمن مساحة عمل تملأ المتصفح.",
    },
    desktop: {
      title: "Nuclo OS - سطح المكتب",
      description: "سطح مكتب مستقل بتطبيقات عاملة: الملفات والملاحظات والطرفية والآلة الحاسبة والمؤقت ولوحة كانبان وتطبيق مالي بمخططات وجدول بيانات وتقويم. يتضمن نظام ملفات محاكى يُحفظ في متصفحك.",
    },
    docs: {
      title: "توثيق Nuclo - الدليل ومرجع API",
      description: "توثيق Nuclo: التثبيت، ودوال بناء الوسوم، واستدعاء update() الصريح، وwhen() وlist()، والأحداث، ودورة الحياة، وSSR والترطيب، وCSS-in-TS محدد الأنواع، ومرجع API الكامل.",
      keywords: "توثيق nuclo, مرجع API, البدء, update, list, when, on",
    },
    examples: {
      title: "أمثلة Nuclo - عدّاد وقائمة مهام وبحث وتنسيق",
      description: "أمثلة Nuclo مباشرة مع الكود المصدري: عدّاد وقائمة مهام ومرشح بحث فوري وتنسيق CSS-in-TS محدد الأنواع.",
      keywords: "أمثلة nuclo, عدّاد, قائمة مهام, مرشح بحث, css-in-ts, عروض مباشرة",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - أمثلة Nuclo`,
  exampleDescription: (desc: string) => `${desc} مثال Nuclo مباشر مع الكود المصدري.`,
  exampleKeywords: (title: string) => `مثال nuclo, ${title.toLowerCase()}, عرض مباشر, كود مصدري`,
};
