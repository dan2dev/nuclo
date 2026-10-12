// messages.ts: the translations. Each language is a plain object typed from
// the English one, so a missing key is a type error. Messages that embed a
// value are functions: each language puts the value where its grammar wants.
// Money, numbers, plurals, dates, country names and lists are formatted by
// the browser's Intl, per locale. Nothing here knows about the UI.

/** Plural forms, picked by Intl.PluralRules. "#" is replaced by the count. */
type Plural = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export interface Product {
  id: keyof Messages["products"];
  emoji: string;
  usd: number; // prices are stored in one currency, converted for display
}

export const PRODUCTS: Product[] = [
  { id: "coffee", emoji: "☕", usd: 18 },
  { id: "matcha", emoji: "🍵", usd: 24 },
  { id: "chocolate", emoji: "🍫", usd: 7.5 },
  { id: "honey", emoji: "🍯", usd: 12 },
  { id: "cookies", emoji: "🍪", usd: 6 },
  { id: "teapot", emoji: "🫖", usd: 39 },
];

const en = {
  title: "Corner Store", tagline: "Good things for your kitchen.", language: "Language",
  add: "Add to cart", cart: "Your cart", items: { one: "# item", other: "# items" } as Plural,
  empty: "Your cart is empty.", thanks: "Thank you! Your order is on its way.",
  less: "Remove one", more: "Add one",
  subtotal: "Subtotal", shipping: "Shipping", free: "Free", discount: "Discount", total: "Total",
  freeOver: (amount: string) => `Free shipping over ${amount}.`,
  coupon: "Coupon code", couponHint: "Try NUCLO", delivery: "Delivery", checkout: "Check out",
  shipsTo: (countries: string) => `Ships to: ${countries}.`,
  rates: "Prices converted from US dollars at fixed demo rates.",
  products: { // [name, description]
    coffee: ["Coffee beans", "Medium roast, 500 g"],
    matcha: ["Matcha", "Ceremonial grade, 30 g"],
    chocolate: ["Dark chocolate", "70% cacao bar"],
    honey: ["Wildflower honey", "Raw, 350 g jar"],
    cookies: ["Butter cookies", "Baked this morning"],
    teapot: ["Cast-iron teapot", "Holds 0.8 liters"],
  },
};
type Messages = typeof en;

const pt: Messages = {
  title: "Mercadinho da Esquina", tagline: "Coisas boas para a sua cozinha.", language: "Idioma",
  add: "Adicionar", cart: "Seu carrinho", items: { one: "# item", other: "# itens" },
  empty: "Seu carrinho está vazio.", thanks: "Obrigado! Seu pedido está a caminho.",
  less: "Remover um", more: "Adicionar um",
  subtotal: "Subtotal", shipping: "Frete", free: "Grátis", discount: "Desconto", total: "Total",
  freeOver: (amount) => `Frete grátis acima de ${amount}.`,
  coupon: "Cupom de desconto", couponHint: "Experimente NUCLO", delivery: "Entrega", checkout: "Finalizar compra",
  shipsTo: (countries) => `Países de entrega: ${countries}.`,
  rates: "Preços convertidos do dólar com taxas fixas de demonstração.",
  products: {
    coffee: ["Café em grãos", "Torra média, 500 g"],
    matcha: ["Matcha", "Grau cerimonial, 30 g"],
    chocolate: ["Chocolate amargo", "Barra 70% cacau"],
    honey: ["Mel silvestre", "Puro, pote de 350 g"],
    cookies: ["Biscoitos amanteigados", "Assados hoje de manhã"],
    teapot: ["Bule de ferro fundido", "Capacidade de 0,8 litro"],
  },
};

const de: Messages = {
  title: "Laden an der Ecke", tagline: "Gute Dinge für deine Küche.", language: "Sprache",
  add: "In den Warenkorb", cart: "Dein Warenkorb", items: { one: "# Artikel", other: "# Artikel" },
  empty: "Dein Warenkorb ist leer.", thanks: "Danke! Deine Bestellung ist unterwegs.",
  less: "Einen entfernen", more: "Einen hinzufügen",
  subtotal: "Zwischensumme", shipping: "Versand", free: "Kostenlos", discount: "Rabatt", total: "Gesamt",
  freeOver: (amount) => `Kostenloser Versand ab ${amount}.`,
  coupon: "Gutscheincode", couponHint: "Probier NUCLO", delivery: "Lieferung", checkout: "Zur Kasse",
  shipsTo: (countries) => `Lieferländer: ${countries}.`,
  rates: "Preise zu festen Demo-Kursen aus US-Dollar umgerechnet.",
  products: {
    coffee: ["Kaffeebohnen", "Mittlere Röstung, 500 g"],
    matcha: ["Matcha", "Zeremonienqualität, 30 g"],
    chocolate: ["Zartbitterschokolade", "Tafel mit 70 % Kakao"],
    honey: ["Wildblütenhonig", "Naturbelassen, 350-g-Glas"],
    cookies: ["Butterkekse", "Heute Morgen gebacken"],
    teapot: ["Teekanne aus Gusseisen", "Fasst 0,8 Liter"],
  },
};

const ja: Messages = {
  title: "街角ストア", tagline: "キッチンに、いいものを。", language: "言語",
  add: "カートに追加", cart: "カート", items: { other: "#点" },
  empty: "カートは空です。", thanks: "ありがとうございます！ご注文を承りました。",
  less: "1つ減らす", more: "1つ増やす",
  subtotal: "小計", shipping: "送料", free: "無料", discount: "割引", total: "合計",
  freeOver: (amount) => `${amount}以上で送料無料。`,
  coupon: "クーポンコード", couponHint: "例: NUCLO", delivery: "お届け予定", checkout: "レジに進む",
  shipsTo: (countries) => `配送先：${countries}`,
  rates: "価格はデモ用の固定レートで米ドルから換算しています。",
  products: {
    coffee: ["コーヒー豆", "中煎り・500 g"],
    matcha: ["抹茶", "茶道用・30 g"],
    chocolate: ["ダークチョコレート", "カカオ70%"],
    honey: ["百花蜜", "非加熱・350 g"],
    cookies: ["バタークッキー", "今朝焼きました"],
    teapot: ["南部鉄器の急須", "容量0.8 L"],
  },
};

// Arabic has six plural forms: 0, 1, 2, a few (3–10), many (11–99), and the rest.
const ar: Messages = {
  title: "متجر الحي", tagline: "أشياء جميلة لمطبخك.", language: "اللغة",
  add: "أضف إلى السلة", cart: "سلة التسوق",
  items: { zero: "لا منتجات", one: "منتج واحد", two: "منتجان", few: "# منتجات", many: "# منتجًا", other: "# منتج" },
  empty: "سلتك فارغة.", thanks: "شكرًا لك! طلبك في الطريق.",
  less: "إزالة واحد", more: "إضافة واحد",
  subtotal: "المجموع الفرعي", shipping: "الشحن", free: "مجاني", discount: "الخصم", total: "الإجمالي",
  freeOver: (amount) => `شحن مجاني للطلبات فوق ${amount}`, // no period: the currency ends with one
  coupon: "رمز القسيمة", couponHint: "جرّب NUCLO", delivery: "موعد التوصيل", checkout: "إتمام الشراء",
  shipsTo: (countries) => `نشحن إلى: ${countries}.`,
  rates: "الأسعار محوّلة من الدولار الأمريكي بأسعار صرف ثابتة للعرض.",
  products: {
    coffee: ["حبوب القهوة", "تحميص متوسط، ٥٠٠ غرام"],
    matcha: ["ماتشا", "درجة احتفالية، ٣٠ غرامًا"],
    chocolate: ["شوكولاتة داكنة", "لوح كاكاو ٧٠٪"],
    honey: ["عسل الزهور البرية", "خام، برطمان ٣٥٠ غرامًا"],
    cookies: ["بسكويت بالزبدة", "مخبوز هذا الصباح"],
    teapot: ["إبريق شاي من الحديد الزهر", "سعة ٠٫٨ لتر"],
  },
};

// rate: one US dollar in the display currency.
export const LOCALES = {
  "en-US": { name: "English", currency: "USD", rate: 1, dir: "ltr", t: en },
  "pt-BR": { name: "Português", currency: "BRL", rate: 5.4, dir: "ltr", t: pt },
  "de-DE": { name: "Deutsch", currency: "EUR", rate: 0.92, dir: "ltr", t: de },
  "ja-JP": { name: "日本語", currency: "JPY", rate: 150, dir: "ltr", t: ja },
  "ar-EG": { name: "العربية", currency: "EGP", rate: 48.5, dir: "rtl", t: ar },
};
export type Code = keyof typeof LOCALES;

// Fixed, not new Date(): the server and the browser must print the same text.
const DELIVERY = new Date(Date.UTC(2026, 10, 3, 12));
const SHIPS_TO = ["US", "BR", "DE", "JP", "EG"]; // region codes: Intl.DisplayNames names them

/** One locale's messages and formatters. Built once per build of the shop. */
export function localize(code: Code) {
  const { currency, rate, dir, t } = LOCALES[code];
  const money = new Intl.NumberFormat(code, { style: "currency", currency });
  const num = new Intl.NumberFormat(code);
  const plural = new Intl.PluralRules(code);
  const region = new Intl.DisplayNames(code, { type: "region" });
  return {
    t,
    dir,
    price: (usd: number) => money.format(usd * rate),
    number: num.format, // Intl's format is bound: it can be passed around
    items: (n: number) => (t.items[plural.select(n)] ?? t.items.other).replace("#", num.format(n)),
    delivery: new Intl.DateTimeFormat(code, { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(DELIVERY),
    shipsTo: new Intl.ListFormat(code).format(SHIPS_TO.map((r) => region.of(r)!)),
  };
}
export type Localized = ReturnType<typeof localize>;
