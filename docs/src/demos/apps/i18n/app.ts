// app.ts: the shop. Every label is a static value, written exactly as in an
// app with one language: h1(t.title), button(t.add). update() never reads
// them again, so a click costs nothing for them. Only the cart is dynamic.
// Switching the language is rare and changes everything at once: it sets
// `locale` and calls forceUpdate(), which runs Shop() again and patches the
// same elements. The cart, and a code typed in the coupon field, stay.
import "nuclo";
import { LOCALES, PRODUCTS, localize, type Code, type Localized, type Product } from "./messages.ts";
import { s } from "./styles.ts";

interface Line { product: Product; qty: number }

const SHIPPING = 6; // USD, free from FREE_OVER
const FREE_OVER = 50;

let locale: Code = "en-US";
const cart: Line[] = [];
let coupon = "";
let ordered = false;
let builds = 0; // Shop() calls: one per build, none per update()
let switchMs: number | null = null;
let host: HTMLDivElement | undefined; // the element Shop() is rendered into

const subtotal = () => cart.reduce((sum, line) => sum + line.product.usd * line.qty, 0);
const discount = () => (coupon.trim().toUpperCase() === "NUCLO" ? subtotal() / 10 : 0);
const shipping = () => (cart.length === 0 || subtotal() >= FREE_OVER ? 0 : SHIPPING);

function add(product: Product) {
  const line = cart.find((l) => l.product === product);
  if (line) line.qty++;
  else cart.push({ product, qty: 1 });
  ordered = false;
  update();
}

function change(line: Line, by: number) {
  line.qty += by;
  if (line.qty === 0) cart.splice(cart.indexOf(line), 1);
  update();
}

function checkout() {
  cart.length = 0;
  ordered = true;
  update();
}

function switchTo(code: Code) {
  if (!host || code === locale) return;
  locale = code;
  const start = performance.now();
  // The explicit form rebuilds this one tree. A bare forceUpdate() would call
  // every root rendered with render(App) or hydrate(App) again: here, that is
  // the whole docs site around this demo.
  forceUpdate(Shop(), host);
  switchMs = performance.now() - start;
  update(); // the diagnostics strip is outside the rebuilt tree
}

function ProductCard(product: Product, { t, price }: Localized) {
  const [name, description] = t.products[product.id];
  return li(
    s.card,
    span(s.emoji, { "aria-hidden": "true" }, product.emoji),
    strong(name),
    span(s.muted, description),
    div(s.buy, span(s.price, price(product.usd)), button(s.btn, s.add, t.add, { onClick: () => add(product) })),
  );
}

// The split: labels are static, read once per build. Quantities and money
// change on clicks, so they are functions that update() reads again, with
// the formatters of the locale this build was made for.
function Cart({ t, price, number, items, delivery }: Localized) {
  const row = (label: string, value: () => string) => div(dt(label), dd(value));
  return aside(
    s.cart,
    header(s.cartHead, h2(t.cart), span(s.muted, () => items(cart.reduce((n, line) => n + line.qty, 0)))),
    when(() => cart.length === 0, p(s.muted, () => (ordered ? t.thanks : t.empty))).else(
      ul(s.lines, list(() => cart, (line) =>
        li(
          s.line,
          span(s.name, `${line.product.emoji} ${t.products[line.product.id][0]}`),
          button(s.icon, { title: t.less, "aria-label": t.less, onClick: () => change(line, -1) }, "−"),
          span(s.qty, () => number(line.qty)),
          button(s.icon, { title: t.more, "aria-label": t.more, onClick: () => change(line, 1) }, "+"),
          span(s.amount, () => price(line.product.usd * line.qty)),
        ))),
    ),
    dl(
      s.totals,
      row(t.subtotal, () => price(subtotal())),
      row(t.shipping, () => (shipping() === 0 ? t.free : price(shipping()))),
      when(() => discount() > 0, row(t.discount, () => price(-discount()))),
      div(s.total, dt(t.total), dd(() => price(subtotal() + shipping() - discount()))),
    ),
    p(s.muted, t.freeOver(price(FREE_OVER))),
    label(
      s.field,
      t.coupon,
      // No value binding: the typed text lives in the element, and
      // forceUpdate() reuses the element. Only the placeholder is replaced.
      input({ placeholder: t.couponHint, onInput: (e) => { coupon = e.currentTarget.value; update(); } }),
    ),
    div(s.delivery, span(s.muted, t.delivery), strong(delivery)),
    button(s.btn, s.primary, t.checkout, { disabled: () => cart.length === 0, onClick: checkout }),
  );
}

function Shop() {
  builds++;
  const l = localize(locale);
  const { t } = l;
  return div(
    s.shop,
    { lang: locale, dir: l.dir }, // static as well: forceUpdate() patches them
    header(
      s.head,
      div(h1(t.title), p(s.muted, t.tagline)),
      nav(
        s.langs,
        { "aria-label": t.language },
        ...(Object.keys(LOCALES) as Code[]).map((code) =>
          button(
            cx(s.lang, code === locale ? s.on : null), // static: only a switch changes it
            { lang: code, "aria-pressed": String(code === locale), onClick: () => switchTo(code) },
            LOCALES[code].name,
          ),
        ),
      ),
    ),
    div(s.body, ul(s.grid, ...PRODUCTS.map((product) => ProductCard(product, l))), Cart(l)),
    footer(s.foot, span(s.muted, t.shipsTo(l.shipsTo)), span(s.muted, t.rates)),
  );
}

export function LocaleShop() {
  builds = 0; // a new tree: its builds count from here,
  coupon = ""; // and its coupon field starts empty
  return div(
    s.app,
    div(s.host, { onMount: (el) => { host = el; return () => { host = undefined; }; } }, Shop()),
    div(
      s.diag,
      span(s.diagLabel, "Diagnostics"),
      span("Shop() built ", strong(() => `${builds}×`)),
      span("last switch ", strong(() => (switchMs === null ? "none yet" : `${switchMs.toFixed(1)} ms`))),
      span("cart clicks: update() · language: forceUpdate()"),
    ),
  );
}
