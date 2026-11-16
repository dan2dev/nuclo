/**
 * Responsive layouts: one screen whose structure changes with the window's width (resize it, rotate the phone).
 *
 *   Breakpoint  a badge per range, only one shown: xs < 480 ≤ sm < 768 ≤ md < 1024 ≤ lg < 1280 ≤ xl
 *   Nav         inline links from md; below it a menu button that opens a vertical menu
 *   Shell       sidebar, content and aside: stacked, then sidebar + content (md), then all three (lg)
 *   Grid        cards 1 / 2 / 3 / 4 / 6 a row, by percent widths
 *   Media       picture over the text, then beside it (sm)
 *   Form        labels above the fields, then beside them (md)
 *   Pricing     tiers stacked, then side by side with the featured one raised (md)
 *   Table       one card per record below md, a table with more columns from md and lg
 *   Footer      columns that wrap: 1, 2, then 4 a row
 *   Container   a centred max width, with padding that grows with the screen
 */
import { button, createCss, div, footer, h1, h2, header, input, list, main, nav, p, render, section, span, strong, update } from "../../src/index.ts";

const { css } = createCss({
  colors: { ink: "#0f172a", soft: "#64748b", line: "#e2e8f0", page: "#f1f5f9", card: "#ffffff", brand: "#2563eb", brandSoft: "#dbeafe" },
  radii: { card: 14, pill: 999 },
  shadows: { card: "0 2px 8px rgba(15, 23, 42, 0.08)" },
  screens: { sm: "(min-width: 480px)", md: "(min-width: 768px)", lg: "(min-width: 1024px)", xl: "(min-width: 1280px)" },
});

interface Product {
  name: string;
  price: string;
  color: string;
}

interface Tier {
  name: string;
  price: string;
  perks: string[];
  featured: boolean;
}

interface Order {
  id: string;
  customer: string;
  total: string;
  status: string;
  date: string;
}

const LINKS = ["Overview", "Products", "Orders", "Reports"];
const products: Product[] = [
  { name: "Lamp", price: "$48", color: "#f59e0b" },
  { name: "Chair", price: "$129", color: "#10b981" },
  { name: "Desk", price: "$340", color: "#6366f1" },
  { name: "Rug", price: "$95", color: "#ec4899" },
  { name: "Shelf", price: "$76", color: "#14b8a6" },
  { name: "Vase", price: "$22", color: "#f97316" },
];
const tiers: Tier[] = [
  { name: "Starter", price: "$0", perks: ["1 project", "Community help"], featured: false },
  { name: "Pro", price: "$12", perks: ["10 projects", "Email help", "Custom domain"], featured: true },
  { name: "Team", price: "$40", perks: ["Unlimited projects", "Priority help", "SSO", "Audit log"], featured: false },
];
const orders: Order[] = [
  { id: "#1042", customer: "Ada Byron", total: "$129.00", status: "Paid", date: "Nov 12" },
  { id: "#1043", customer: "Alan Kay", total: "$48.00", status: "Pending", date: "Nov 13" },
  { id: "#1044", customer: "Grace Hopper", total: "$435.00", status: "Paid", date: "Nov 14" },
  { id: "#1045", customer: "Linus Pauling", total: "$22.00", status: "Refunded", date: "Nov 15" },
];

let menuOpen = false;
let active = "Overview";
let email = "";

const card = css({ bg: "card", rounded: "card", shadow: "card", p: 14, gap: 8, md: { p: 20 } });
const muted = css({ color: "soft", text: 13 });
const sectionTitle = css({ text: 13, weight: 600, color: "soft", textTransform: "uppercase", tracking: "0.5px" });

// Exactly one badge is shown, the one whose range holds the window's width.
const badge = (name: string, color: string) =>
  span(name, { style: { color: "#ffffff", bg: color, rounded: "pill", px: 10, py: 3, text: 12, weight: 700 } });

const Breakpoint = () =>
  div(
    { style: { row: true, items: "center", gap: 8 } },
    span("Breakpoint", muted),
    div({ style: { display: "flex", "@media (min-width: 480px)": { display: "none" } } }, badge("xs  < 480", "#64748b")),
    div({ style: { display: "none", "@media (min-width: 480px) and (max-width: 767px)": { display: "flex" } } }, badge("sm  480–767", "#0ea5e9")),
    div({ style: { display: "none", "@media (min-width: 768px) and (max-width: 1023px)": { display: "flex" } } }, badge("md  768–1023", "#22c55e")),
    div({ style: { display: "none", "@media (min-width: 1024px) and (max-width: 1279px)": { display: "flex" } } }, badge("lg  1024–1279", "#f59e0b")),
    div({ style: { display: "none", "@media (min-width: 1280px)": { display: "flex" } } }, badge("xl  ≥ 1280", "#ef4444")),
  );

const NavLink = (name: string) =>
  button(name, {
    style: () => ({ px: 12, py: 8, rounded: 8, bg: active === name ? "#dbeafe" : "transparent", color: active === name ? "#2563eb" : "#0f172a", weight: active === name ? 600 : 400 }),
    onClick: () => {
      active = name;
      menuOpen = false;
      update();
    },
  });

const Nav = () =>
  header(
    { style: { bg: "card", borderBottom: "1px solid line", px: 16, py: 10, gap: 8 } },
    div(
      { style: { row: true, items: "center", justify: "space-between" } },
      strong("Shopfront", { style: { text: 18 } }),
      // Inline links from md.
      nav(css({ display: "none", md: { display: "flex", row: true, gap: 4 } }), list(() => LINKS, (name) => NavLink(name))),
      // The menu button below md.
      button(() => (menuOpen ? "✕" : "☰ Menu"), {
        style: { px: 12, py: 8, rounded: 8, border: "1px solid line", "@media (min-width: 768px)": { display: "none" } },
        onClick: () => {
          menuOpen = !menuOpen;
          update();
        },
      }),
    ),
    // The opened menu, never shown from md even when it was left open.
    nav(
      { style: () => ({ display: menuOpen ? "flex" : "none", gap: 2, "@media (min-width: 768px)": { display: "none" } }) },
      list(() => LINKS, (name) => NavLink(name)),
    ),
  );

const Sidebar = () =>
  section(
    css({ gap: 6, md: { width: 200 }, lg: { width: 220 } }),
    div(card, span("Filters", sectionTitle),
      // A row of chips that wraps when stacked, a column beside the content.
      div(css({ row: true, flexWrap: "wrap", gap: 6, md: { flexDirection: "column" } }),
        list(() => ["All", "In stock", "On sale", "New"], (f) =>
          span(f, { style: { px: 10, py: 6, rounded: "pill", bg: "brandSoft", color: "brand", text: 13 } }),
        ),
      ),
    ),
  );

const Aside = () =>
  section(
    css({ display: "none", lg: { display: "flex", width: 240, gap: 12 } }),
    div(card, span("Only on large screens", sectionTitle), p("This column exists from 1024 px.", muted)),
    div(card, span("Tip", sectionTitle), p("Resize the window to watch every section rearrange.", muted)),
  );

const ProductGrid = () =>
  div(
    card,
    span("Grid: 1 · 2 · 3 · 4 · 6 a row", sectionTitle),
    div(
      { style: { row: true, flexWrap: "wrap", margin: -6 } },
      list(() => products, (product) =>
        div(
          css({ width: "100%", p: 6, sm: { width: "50%" }, md: { width: "33.333%" }, lg: { width: "25%" }, xl: { width: "16.666%" } }),
          div(
            { style: { rounded: 10, border: "1px solid line", overflow: "hidden" } },
            div({ style: { aspectRatio: "4 / 3", bg: product.color } }),
            div({ style: { p: 10, row: true, justify: "space-between" } }, span(product.name, { style: { weight: 600 } }), span(product.price, muted)),
          ),
        ),
      ),
    ),
  );

const MediaObject = () =>
  div(
    card,
    span("Media: stacked, then side by side", sectionTitle),
    div(
      css({ gap: 12, sm: { flexDirection: "row", items: "center" } }),
      div(css({ bg: "#a78bfa", rounded: 10, aspectRatio: "16 / 9", width: "100%", sm: { width: 160, aspectRatio: 1 }, lg: { width: 200 } })),
      div(
        { style: { flex: 1, gap: 4 } },
        strong("Winter collection"),
        p("The picture spans the card on a phone and sits beside the text from 480 px. Its shape changes too.", { style: { color: "soft", leading: 1.4 } }),
      ),
    ),
  );

const Field = (labelText: string, placeholder: string) =>
  div(
    css({ gap: 4, md: { flexDirection: "row", items: "center", gap: 12 } }),
    span(labelText, css({ weight: 500, md: { width: 120, textAlign: "right" } })),
    input({ placeholder, value: () => email, style: { flex: 1, border: "1px solid line", rounded: 8, p: 10 }, onInput: (e) => { email = e.target.value; update(); } }),
  );

const Form = () =>
  div(
    card,
    span("Form: labels above, then beside", sectionTitle),
    Field("Email", "you@example.com"),
    Field("Coupon", "WINTER25"),
    div(
      css({ gap: 8, sm: { flexDirection: "row", justify: "flex-end" } }),
      button("Cancel", { style: { px: 16, py: 10, rounded: 8, border: "1px solid line" } }),
      button("Subscribe", { style: { px: 16, py: 10, rounded: 8, bg: "brand", color: "#ffffff", weight: 600 } }),
    ),
  );

const Pricing = () =>
  div(
    card,
    span("Pricing: stacked, then side by side", sectionTitle),
    div(
      css({ gap: 12, md: { flexDirection: "row", items: "stretch", py: 12 } }),
      list(() => tiers, (tier) =>
        div(
          tier.featured
            ? css({ flex: 1, gap: 6, p: 16, rounded: 12, bg: "ink", color: "#ffffff", md: { scale: 1.05, zIndex: 1 } })
            : css({ flex: 1, gap: 6, p: 16, rounded: 12, border: "1px solid line" }),
          span(tier.name, { style: { weight: 600 } }),
          span(tier.price, { style: { text: 28, weight: 700 } }),
          list(() => tier.perks, (perk) => span(`✓ ${perk}`, { style: { text: 13, opacity: 0.8 } })),
        ),
      ),
    ),
  );

const statusColor = (status: string): string => (status === "Paid" ? "#16a34a" : status === "Pending" ? "#d97706" : "#dc2626");

const Orders = () =>
  div(
    card,
    span("Table: cards, then columns (more from lg)", sectionTitle),
    // The header row, from md.
    div(
      css({ display: "none", md: { display: "flex", row: true, py: 8, borderBottom: "1px solid line" } }),
      span("Order", css({ width: 80, color: "soft", text: 12 })),
      span("Customer", css({ flex: 1, color: "soft", text: 12 })),
      span("Date", css({ display: "none", lg: { display: "flex", width: 90, color: "soft", text: 12 } })),
      span("Status", css({ width: 90, color: "soft", text: 12 })),
      span("Total", css({ width: 90, color: "soft", text: 12, textAlign: "right" })),
    ),
    list(() => orders, (order) =>
      div(
        css({ gap: 4, p: 12, rounded: 10, border: "1px solid line", md: { flexDirection: "row", items: "center", gap: 0, p: 0, py: 10, rounded: 0, borderWidth: 0, borderBottom: "1px solid line" } }),
        div(
          css({ row: true, justify: "space-between", md: { width: 80 } }),
          strong(order.id),
          span(order.total, css({ weight: 600, md: { display: "none" } })),
        ),
        span(order.customer, css({ md: { flex: 1 } })),
        span(order.date, css({ display: "none", lg: { display: "flex", width: 90, color: "soft" } })),
        span(order.status, { style: { color: statusColor(order.status), text: 13, weight: 600, "@media (min-width: 768px)": { width: 90 } } }),
        span(order.total, css({ display: "none", md: { display: "flex", width: 90, textAlign: "right" } })),
      ),
    ),
  );

const FooterColumn = (title: string, items: string[]) =>
  div(
    css({ width: "100%", p: 8, gap: 4, sm: { width: "50%" }, lg: { width: "25%" } }),
    strong(title, { style: { color: "#ffffff" } }),
    list(() => items, (item) => span(item, { style: { color: "#94a3b8", text: 13 } })),
  );

const App = () =>
  div(
    { style: { bg: "page", flex: 1 } },
    Nav(),
    main(
      css({ p: 12, gap: 12, maxWidth: 1360, width: "100%", alignSelf: "center", sm: { p: 16 }, md: { p: 24, gap: 16 }, xl: { p: 32 } }),
      h1(() => active, css({ text: 24, weight: 700, md: { text: 32 }, lg: { text: 40 } })),
      Breakpoint(),
      div(
        css({ gap: 12, md: { flexDirection: "row", items: "flex-start", gap: 16 } }),
        Sidebar(),
        div({ style: { flex: 1, gap: 12 } }, ProductGrid(), MediaObject(), Form(), Pricing(), Orders()),
        Aside(),
      ),
    ),
    footer(
      { style: { bg: "ink", p: 16 } },
      div(
        { style: { row: true, flexWrap: "wrap", maxWidth: 1360, width: "100%", alignSelf: "center" } },
        FooterColumn("Shop", ["New", "Sale", "Gift cards"]),
        FooterColumn("Help", ["Shipping", "Returns", "Contact"]),
        FooterColumn("Company", ["About", "Careers", "Press"]),
        FooterColumn("Follow", ["Newsletter", "Blog"]),
      ),
      h2("© 2026 Shopfront", { style: { color: "#64748b", text: 12, textAlign: "center", mt: 12 } }),
    ),
  );

render(App);
