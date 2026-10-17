// ui.ts: the chrome's text, in the main bundle. Header, footer, app shell, SEO
// meta and the labels shared by every page. pt/ui.ts and es/ui.ts mirror it.

export const nav = {
  home: "होम",
  docs: "दस्तावेज़",
  examples: "उदाहरण",
  getStarted: "शुरू करें",
  menu: "मेन्यू",
  main: "मुख्य नेविगेशन",
  openMenu: "मेन्यू खोलें",
  closeMenu: "मेन्यू बंद करें",
  nucloHome: "Nuclo होम",
  nucloOnGitHub: "GitHub पर Nuclo",
  opensInNewTab: " (नए टैब में खुलता है)",
  switchTheme: "रंग थीम बदलें",
  language: "भाषा",
};

export const footer = {
  tagline: "स्पष्ट अपडेट वाला UI रनटाइम। साधारण फ़ंक्शन, बदला जा सकने वाला स्टेट और आपके डेटा से DOM तक केवल एक कॉल।",
  builtWith: "यह साइट Nuclo से बनी है।",
  explore: "देखें",
  documentation: "दस्तावेज़",
  examples: "उदाहरण",
  readme: "README",
  project: "प्रोजेक्ट",
  github: "GitHub",
  license: "MIT लाइसेंस",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · MIT License",
};

export const app = {
  failedToLoad: "पेज लोड नहीं हो सका",
  loadingLanguage: "भाषा लोड हो रही है…",
  notFound: "पेज नहीं मिला",
  notFoundHint: "इस पते पर कोई पेज नहीं है।",
  goHome: "होम पेज पर जाएँ",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "प्रीव्यू",
  code: "कोड",
  copy: "कॉपी करें",
  copied: "✓ कॉपी हो गया",
  copyToClipboard: "क्लिपबोर्ड पर कॉपी करें",
  live: "लाइव",
  openFullScreen: "यह उदाहरण पूरी स्क्रीन पर खोलें",
  open: "खोलें ↗",
  readTheDocs: "दस्तावेज़ पढ़ें →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - स्पष्ट अपडेट वाला हल्का DOM फ़्रेमवर्क",
      description: "Nuclo एक हल्की TypeScript DOM लाइब्रेरी है जिसकी कोई बाहरी निर्भरता नहीं है। फ़ंक्शन से UI बनाएँ, साधारण स्टेट बदलें और update() कॉल करें। कोई वर्चुअल DOM, प्रॉक्सी या सिग्नल नहीं।",
      keywords: "nuclo, DOM फ़्रेमवर्क, स्टेट पर निर्भर मान, स्पष्ट अपडेट, बदला जा सकने वाला स्टेट, javascript, typescript, UI फ़्रेमवर्क, हल्का",
    },
    "apps/:id": {
      title: "स्वतंत्र ऐप - Nuclo उदाहरण",
      description: "पूरे ब्राउज़र के कार्यरीजन में चलने वाले इंटरैक्टिव Nuclo ऐप के उदाहरण।",
    },
    desktop: {
      title: "Nuclo OS - डेस्कटॉप",
      description: "काम करने वाले ऐप के साथ एक स्वतंत्र डेस्कटॉप: फ़ाइलें, नोट्स, टर्मिनल, कैलकुलेटर, टाइमर, कानबान बोर्ड, चार्ट और स्प्रेडशीट वाला वित्त ऐप और कैलेंडर। इसका सिम्युलेटेड फ़ाइल सिस्टम आपके ब्राउज़र में सेव होता है।",
    },
    docs: {
      title: "Nuclo दस्तावेज़ - गाइड और API संदर्भ",
      description: "Nuclo दस्तावेज़: इंस्टॉलेशन, टैग बिल्डर, स्पष्ट update(), when() और list(), इवेंट, लाइफ़साइकल, SSR और हाइड्रेशन, टाइपयुक्त CSS-in-TS और पूरा API संदर्भ।",
      keywords: "nuclo दस्तावेज़, API संदर्भ, शुरुआत, update, list, when, on",
    },
    examples: {
      title: "Nuclo उदाहरण - काउंटर, कार्य सूची, खोज और स्टाइलिंग",
      description: "सोर्स कोड के साथ Nuclo के लाइव उदाहरण: काउंटर, कार्य सूची, रीयल-टाइम खोज फ़िल्टर और टाइपयुक्त CSS-in-TS स्टाइलिंग।",
      keywords: "nuclo उदाहरण, काउंटर, कार्य सूची, खोज फ़िल्टर, css-in-ts, लाइव डेमो",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Nuclo उदाहरण`,
  exampleDescription: (desc: string) => `${desc} सोर्स कोड के साथ Nuclo का एक लाइव उदाहरण।`,
  exampleKeywords: (title: string) => `nuclo उदाहरण, ${title.toLowerCase()}, लाइव डेमो, सोर्स कोड`,
};
