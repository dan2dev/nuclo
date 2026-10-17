import type { DocGroupText } from "../../pages/docs/content.ts";
import { GROUPS_1 } from "./docs-1.ts";
import { GROUPS_2 } from "./docs-2.ts";

export const GROUPS: DocGroupText[] = [...GROUPS_1, ...GROUPS_2];

// ── The docs page's chrome ──
export const LABELS = {
  documentation: "दस्तावेज़",
  title: "Nuclo दस्तावेज़",
  lead: "Nuclo इंस्टॉल करने, स्पष्ट अपडेट के साथ UI बनाने, टाइपयुक्त CSS से स्टाइल करने और सर्वर पर HTML रेंडर करने के लिए व्यावहारिक संदर्भ।",
  quickStart: "त्वरित शुरुआत",
  quickStartLink: "त्वरित शुरुआत",
  nucloMark: "Nuclo चिह्न",
  facts: { release: "मौजूदा रिलीज़", builders: "टैग बिल्डर", gzipped: "कोर, gzip संपीड़ित", model: "रनटाइम मॉडल", modelValue: "स्पष्ट" },
  filterSections: "सेक्शन फ़िल्टर करें",
  filter: "फ़िल्टर",
  closeNavigator: "नेविगेटर बंद करें",
  docsSections: "दस्तावेज़ के सेक्शन",
  docsNavigation: "दस्तावेज़ नेविगेशन",
  onThisPage: "इस पेज पर",
  publicApi: "सार्वजनिक API",
  linkTo: (title: string) => `${title} का लिंक`,
  openExample: (title: string) => `${title} उदाहरण खोलें`,
  example: (title: string) => `उदाहरण: ${title}`,
};
