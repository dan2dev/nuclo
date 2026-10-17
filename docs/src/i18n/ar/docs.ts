import type { DocGroupText } from "../../pages/docs/content.ts";
import { GROUPS_1 } from "./docs-1.ts";
import { GROUPS_2 } from "./docs-2.ts";

export const GROUPS: DocGroupText[] = [...GROUPS_1, ...GROUPS_2];

// ── The docs page's chrome ──
export const LABELS = {
  documentation: "التوثيق",
  title: "توثيق Nuclo",
  lead: "مرجع عملي لتثبيت Nuclo وبناء الواجهات بتحديثات صريحة وتنسيقها باستخدام CSS محدد الأنواع وعرض HTML على الخادم.",
  quickStart: "البدء السريع",
  quickStartLink: "البدء السريع",
  nucloMark: "شعار Nuclo",
  facts: { release: "الإصدار الحالي", builders: "دوال بناء الوسوم", gzipped: "النواة، مضغوطة بـ gzip", model: "نموذج التشغيل", modelValue: "صريح" },
  filterSections: "تصفية الأقسام",
  filter: "تصفية",
  closeNavigator: "إغلاق المتصفح الجانبي",
  docsSections: "أقسام التوثيق",
  docsNavigation: "التنقل في التوثيق",
  onThisPage: "في هذه الصفحة",
  publicApi: "واجهة API العامة",
  linkTo: (title: string) => `رابط إلى ${title}`,
  openExample: (title: string) => `فتح مثال ${title}`,
  example: (title: string) => `مثال: ${title}`,
};
