import type { DocGroupText } from "../../pages/docs/content.ts";
import { GROUPS_1 } from "./docs-1.ts";
import { GROUPS_2 } from "./docs-2.ts";

export const GROUPS: DocGroupText[] = [...GROUPS_1, ...GROUPS_2];

// ── The docs page's chrome ──
export const LABELS = {
  documentation: "التوثيق",
  title: "توثيق Nuclo",
  lead: "دليل عملي من التثبيت إلى الإنتاج: كيف تبني واجهات Nuclo بتحديثات صريحة، وتنسّقها بـ CSS بأنواع محكمة، وتعرضها كـ HTML على الخادم.",
  quickStart: "البدء السريع",
  quickStartLink: "البدء السريع",
  nucloMark: "شعار Nuclo",
  facts: { release: "الإصدار الحالي", builders: "دوال بناء الوسوم", gzipped: "حجم النواة (gzip)", model: "نموذج التحديث", modelValue: "صريح" },
  filterSections: "ابحث في الأقسام",
  filter: "بحث",
  closeNavigator: "إغلاق قائمة الأقسام",
  docsSections: "أقسام التوثيق",
  docsNavigation: "التنقل في التوثيق",
  onThisPage: "في هذه الصفحة",
  publicApi: "الـ API العام",
  linkTo: (title: string) => `رابط إلى ${title}`,
  openExample: (title: string) => `فتح مثال ${title}`,
  example: (title: string) => `مثال: ${title}`,
};
