import { css, colors } from "../styles.ts";
import { withCode } from "./inline-code.ts";
import { exampleHref, onOpenExample } from "../pages/examples/open.ts";

// One live demo per API, shown on /examples (ExampleCard) and inside each docs section (Live).
// Each demo keeps its own state, so every visit starts fresh. `code` is what the
// card's Code tab shows: keep it in step with the demo below it.

const mono = "ui-monospace, monospace";

const ls = {
  // `&&` outranks the docs prose rules (`.content p`, `.content h1`, …) so demo markup stays compact.
  root: css("api-demo-root", {
    display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", fontSize: "0.9375rem", color: colors.text,
    "&& :is(h1, h2, p, ul, li)": { raw: { margin: "0" } },
    "&& :is(h1, h2)": { raw: { "font-size": "1.125rem", "font-weight": "600", "line-height": "1.4" } },
    "&& p": { raw: { "font-size": "0.9375rem", "line-height": "1.6" } },
    "&& ul": { raw: { padding: "0", "list-style": "none" } },
  }),
  frame: css("docs-live-frame", { margin: "22px 0", border: `1px solid ${colors.border}`, borderRadius: "10px", overflow: "hidden", backgroundColor: colors.bgCard }),
  open: css("docs-live-open", { flexShrink: 0, marginLeft: "auto", fontSize: "0.75rem", fontWeight: "600", color: colors.primaryInk, whiteSpace: "nowrap", hover: { textDecoration: "underline" } }),
  head: css("docs-live-head", { display: "flex", alignItems: "baseline", gap: "10px", padding: "9px 16px", borderBottom: `1px solid ${colors.border}`, fontSize: "0.8125rem", lineHeight: "1.5", color: colors.textMuted }),
  badge: css("docs-live-badge", { flexShrink: 0, fontFamily: mono, fontSize: "0.75rem", fontWeight: "700", color: colors.primaryInk }),
  body: css("docs-live-body", { padding: "20px", "@media (max-width: 600px)": { padding: "16px" } }),
  stack: css("api-demo-stack", { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px" }),
  row: css("api-demo-row", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }),
  btn: css("api-demo-btn", { display: "inline-flex", alignItems: "center", height: "36px", padding: "0 14px", borderRadius: "8px", border: `1px solid ${colors.borderLight}`, fontFamily: "inherit", fontSize: "0.875rem", fontWeight: "600", color: colors.text, whiteSpace: "nowrap", hover: { backgroundColor: colors.bgSecondary }, disabled: { opacity: "0.45", cursor: "not-allowed" }, '&[aria-pressed="true"]': { borderColor: colors.primary, color: colors.primaryInk }, "@media (max-width: 600px)": { height: "44px" } }),
  input: css("api-demo-input", { height: "36px", width: "100%", maxWidth: "320px", padding: "0 12px", borderRadius: "8px", border: `1px solid ${colors.borderLight}`, backgroundColor: colors.bg, color: colors.text, fontFamily: "inherit", fontSize: "0.9375rem", focus: { borderColor: colors.primary, outline: "none" }, "@media (max-width: 600px)": { height: "44px", fontSize: "16px" } }),
  muted: css("api-demo-muted", { color: colors.textMuted }),
  value: css("api-demo-value", { fontFamily: mono, fontSize: "0.875rem" }),
  panel: css("api-demo-panel", { flex: "1 1 140px", padding: "10px 12px", borderRadius: "8px", backgroundColor: colors.bgSecondary }),
  rows: css("api-demo-rows", { width: "100%", maxWidth: "320px", border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden", "& > * + *": { raw: { "border-top": "1px solid var(--c-border)" } } }),
  rowItem: css("api-demo-rowItem", { display: "flex", alignItems: "center", gap: "10px", minHeight: "40px", padding: "0 12px", cursor: "pointer" }),
  done: css("api-demo-done", { textDecoration: "line-through", color: colors.textMuted }),
  // region() demo: a small app frame with a nav, a stacked main region and a side region.
  app: css("api-demo-app", { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 140px", gap: "10px", width: "100%", "@media (max-width: 600px)": { gridTemplateColumns: "minmax(0, 1fr)" } }),
  appNav: css("api-demo-appNav", { raw: { "grid-column": "1 / -1" } }),
  appMain: css("api-demo-appMain", { position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px", minHeight: "150px", padding: "14px", border: `1px dashed ${colors.borderLight}`, borderRadius: "8px" }),
  appSide: css("api-demo-appSide", { display: "flex", flexDirection: "column", gap: "6px", padding: "14px", border: `1px dashed ${colors.borderLight}`, borderRadius: "8px", fontSize: "0.875rem" }),
  dialog: css("api-demo-dialog", { position: "absolute", inset: "0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "16px", textAlign: "center", borderRadius: "8px", backgroundColor: colors.bgCard, boxShadow: "var(--c-shadow)", border: `1px solid ${colors.border}` }),
};

const btn = (text: string | (() => string), onClick: () => void, ...rest: NodeModLike<"button">[]) =>
  button(ls.btn, { type: "button", onClick }, text, ...rest);

// ── Demos ────────────────────────────────────────────────────────────────

function TagBuilders() {
  let name = "Ada";
  return div(
    ls.stack,
    { className: "card" },
    h2("Profile"),
    p(() => `Hello, ${name}`),
    btn("Rename", () => { name = name === "Ada" ? "Grace" : "Ada"; update(); }),
  );
}

function Components() {
  function Counter(label: string) {
    let count = 0; // one per call
    return btn(() => `${label}: ${count}`, () => { count++; update(); });
  }
  return div(ls.row, Counter("A"), Counter("B"));
}

function Attributes() {
  let busy = false;
  return div(
    ls.row,
    button(ls.btn, { type: "submit", disabled: () => busy, "aria-busy": () => String(busy), "data-id": 42 }, "Save"),
    btn(() => `busy = ${busy}`, () => { busy = !busy; update(); }),
  );
}

function Events() {
  let query = "";
  return div(
    ls.stack,
    { style: { width: "100%" } },
    input(ls.input, {
      type: "search",
      placeholder: "Search",
      "aria-label": "Search",
      value: () => query,
      onInput: (e) => { query = e.currentTarget.value; update(); },
      onKeyDown: (e) => { if (e.key === "Escape") { query = ""; update(); } },
    }),
    p(ls.muted, () => (query ? `query = "${query}"` : "Type something, then press Escape.")),
  );
}

function Lifecycle() {
  let seconds = 0;
  let shown = false;

  const Timer = () =>
    span(
      ls.value,
      {
        onMount: () => {
          const id = setInterval(() => { seconds++; update(); }, 1000);
          return () => clearInterval(id); // runs when the span is removed
        },
      },
      () => `${seconds}s`,
    );

  return div(
    ls.row,
    btn(() => (shown ? "Unmount timer" : "Mount timer"), () => { shown = !shown; update(); }),
    when(() => shown, Timer()),
  );
}

function ExplicitUpdates() {
  let count = 0;
  return div(
    ls.stack,
    p(() => `Clicked ${count} times`),
    div(ls.row, btn("count++", () => { count++; }), btn("update()", () => update())),
  );
}

function DynamicValues() {
  let name = "Alice";
  let host: Element | undefined;

  const Greeting = () => div(
    ls.stack,
    input(ls.input, { "aria-label": "Name", value: () => name, onInput: (e) => { name = e.currentTarget.value; update(); } }),
    div(
      p(span(ls.muted, "static: "), `Hello, ${name}`),
      p(span(ls.muted, "dynamic: "), () => `Hello, ${name}`),
    ),
  );

  return div(
    ls.stack,
    { style: { width: "100%" } },
    div({ style: { width: "100%" }, onMount: (el) => { host = el as unknown as Element; } }, Greeting()),
    // Rebuilds Greeting, so the static text catches up too.
    btn("forceUpdate()", () => { if (host) forceUpdate(Greeting(), host); }),
  );
}

function Update() {
  let runs = 0;
  return div(
    ls.stack,
    p(() => `This dynamic value has run ${++runs} times.`),
    btn("update()", () => update()),
  );
}

function Scope() {
  const names = ["Ada", "Grace", "Alan", "Linus"];
  const cartItems: string[] = [];
  let user = "Ada";
  const change = () => { cartItems.push("apple"); user = names[cartItems.length % names.length]; };

  return div(
    ls.stack,
    { style: { width: "100%" } },
    div(ls.row, { style: { width: "100%" } },
      div(ls.panel, () => `Hi, ${user}`),
      div(ls.panel, scope("cart"), () => `Items: ${cartItems.length}`),
    ),
    div(
      ls.row,
      btn("update('cart')", () => { change(); update("cart"); }),
      btn("update()", () => { change(); update(); }),
    ),
  );
}

function When() {
  type Status = "loading" | "error" | "ready";
  let status: Status = "loading";
  const pick = (next: Status) =>
    btn(next, () => { status = next; update(); }, { "aria-pressed": () => String(status === next) });

  return div(
    ls.stack,
    div(ls.row, pick("loading"), pick("error"), pick("ready")),
    when(() => status === "loading", p("Loading…"))
      .when(() => status === "error", p("Something went wrong"))
      .else(p("Ready")),
  );
}

function List() {
  const pool = ["Cherry", "Date", "Elderberry", "Fig", "Grape"];
  let next = 0;
  const fruits = [{ name: "Apple", done: false }, { name: "Banana", done: false }];

  return div(
    ls.stack,
    { style: { width: "100%" } },
    div(
      ls.row,
      btn("Add", () => { fruits.push({ name: pool[next++ % pool.length], done: false }); update(); }),
      btn("Reverse", () => { fruits.reverse(); update(); }),
      btn("Remove first", () => { fruits.shift(); update(); }),
    ),
    ul(
      ls.rows,
      list(() => fruits, (fruit) =>
        li(
          label(
            ls.rowItem,
            input({ type: "checkbox", checked: () => fruit.done, onChange: () => { fruit.done = !fruit.done; update(); } }),
            span({ className: () => (fruit.done ? ls.done.className : "") }, () => fruit.name),
          ),
        ),
      ),
    ),
  );
}

function Region() {
  let page: "home" | "article" | null = "home";
  let dialog = false;

  const go = (next: typeof page) => () => { page = next; dialog = false; update(); };
  const tab = (text: string, next: typeof page) => btn(text, go(next), { "aria-pressed": () => String(page === next) });

  const Layout = () =>
    div(
      ls.app,
      nav(ls.row, ls.appNav, { "aria-label": "Demo pages" }, tab("Home", "home"), tab("Article", "article"), tab("Close page", null)),
      div(ls.appMain, region({ id: "main", type: "stack", empty: p(ls.muted, "Nothing open.") })),
      div(ls.appSide, region({ id: "side", empty: p(ls.muted, "No related links.") })),
    );

  const Home = () =>
    into("main",
      input(ls.input, { placeholder: "Type here, then open the dialog", "aria-label": "Home input" }),
      btn("Open dialog", () => { dialog = true; update(); }),
    );

  const Article = () =>
    into({
      main: article(h2("Article"), p("One into() fills both regions.")),
      side: [h2("Related"), ul(li("One"), li("Two"))],
    });

  const Dialog = () =>
    into("main",
      div(ls.dialog, { role: "dialog", "aria-label": "Demo dialog" }, p("On top of Home."), btn("Close", () => { dialog = false; update(); })),
    );

  return div(
    { style: { width: "100%" } },
    Layout(),
    when(() => page === "home", Home()),
    when(() => page === "article", Article()),
    when(() => dialog, Dialog()),
  );
}

function ForceUpdate() {
  const labels = {
    en: { title: "Hello", body: "Static text, fixed on build." },
    pt: { title: "Olá", body: "Texto estático, fixado na criação." },
  };
  let lang: keyof typeof labels = "en";
  let host: Element | undefined;

  const App = () => div(h1(labels[lang].title), p(ls.muted, labels[lang].body));

  return div(
    ls.stack,
    p(ls.value, () => `lang = '${lang}'`),
    div({ onMount: (el) => { host = el as unknown as Element; } }, App()),
    div(
      ls.row,
      btn("Switch lang, update()", () => { lang = lang === "en" ? "pt" : "en"; update(); }),
      btn("forceUpdate(App(), host)", () => { if (host) forceUpdate(App(), host); }),
    ),
  );
}

// ── Registry ─────────────────────────────────────────────────────────────

export interface ApiDemo {
  id: string; // the docs section id
  title: string;
  desc: string;
  code: string;
  preview: () => NodeModLike<"div">;
}

const demo = (id: string, title: string, desc: string, code: string, build: () => NodeModLike<"div">): ApiDemo =>
  ({ id, title, desc, code: code.trim(), preview: () => div(ls.root, build()) });

export const API_DEMOS: ApiDemo[] = [
  demo("tag-builders", "Tag Builders", "A builder takes attributes, static children and dynamic text. Rename changes the state, then calls update().", `
import 'nuclo'

let name = 'Ada'

export const Card = () =>
  div(
    { className: 'card' },
    h2('Profile'),
    p(() => \`Hello, \${name}\`),
    button('Rename', {
      onClick: () => {
        name = name === 'Ada' ? 'Grace' : 'Ada'
        update()
      },
    }),
  )
`, TagBuilders),

  demo("components", "Components", "A component is a plain function. Each Counter() call keeps its own count.", `
import 'nuclo'

function Counter(label: string) {
  let count = 0 // one per call
  return button(() => \`\${label}: \${count}\`, {
    onClick: () => { count++; update() },
  })
}

export const Counters = () => div(Counter('A'), Counter('B'))
`, Components),

  demo("attributes", "Attributes", "Attribute values can be functions. The second button flips busy and calls update(); Save's disabled and aria-busy follow.", `
import 'nuclo'

let busy = false

export const SaveButton = () =>
  div(
    button(
      {
        type: 'submit',
        disabled: () => busy,
        'aria-busy': () => String(busy),
        'data-id': 42,
      },
      'Save',
    ),
    button(() => \`busy = \${busy}\`, {
      onClick: () => { busy = !busy; update() },
    }),
  )
`, Attributes),

  demo("events", "Events", "onInput and onKeyDown are plain attributes. Type, then press Escape to clear.", `
import 'nuclo'

let query = ''

export const Search = () =>
  div(
    input({
      type: 'search',
      placeholder: 'Search',
      value: () => query,
      onInput: (e) => { query = e.currentTarget.value; update() },
      onKeyDown: (e) => {
        if (e.key === 'Escape') { query = ''; update() }
      },
    }),
    p(() => (query ? \`query = "\${query}"\` : 'Type something, then press Escape.')),
  )
`, Events),

  demo("lifecycle", "Lifecycle", "onMount starts an interval and returns its cleanup. Unmount runs the cleanup, so the count pauses until the timer mounts again.", `
import 'nuclo'

let seconds = 0
let shown = false

const Timer = () =>
  span(
    {
      onMount: () => {
        const id = setInterval(() => { seconds++; update() }, 1000)
        return () => clearInterval(id) // runs when the span is removed
      },
    },
    () => \`\${seconds}s\`,
  )

export const TimerToggle = () =>
  div(
    button(() => (shown ? 'Unmount timer' : 'Mount timer'), {
      onClick: () => { shown = !shown; update() },
    }),
    when(() => shown, Timer()),
  )
`, Lifecycle),

  demo("explicit-updates", "Explicit Updates", "count++ only changes the variable. The text catches up on the next update(), from the button or anything else on this page.", `
import 'nuclo'

let count = 0

export const Counter = () =>
  div(
    p(() => \`Clicked \${count} times\`),
    // No update() here, so the text stays as it is.
    button('count++', { onClick: () => { count++ } }),
    button('update()', { onClick: () => update() }),
  )
`, ExplicitUpdates),

  demo("dynamic-functions", "Dynamic Values", "Edit the name. The static text was fixed when the element was built; the dynamic one runs again on every update(). forceUpdate() rebuilds the tree, so the static text catches up too.", `
import 'nuclo'

let name = 'Alice'
let host: Element | undefined

const Greeting = () =>
  div(
    input({
      value: () => name,
      onInput: (e) => { name = e.currentTarget.value; update() },
    }),
    p('static: ', \`Hello, \${name}\`),        // built once
    p('dynamic: ', () => \`Hello, \${name}\`), // runs on every update()
  )

export const App = () =>
  div(
    div({ onMount: (el) => { host = el as unknown as Element } }, Greeting()),
    // Calls Greeting() again and patches the same nodes: the static text
    // catches up. The explicit form rebuilds only this tree.
    button('forceUpdate()', {
      onClick: () => { if (host) forceUpdate(Greeting(), host) },
    }),
  )
`, DynamicValues),

  demo("api-update", "update()", "Every update() runs every dynamic value, even when its data did not change. Other demos on this page push the count up too.", `
import 'nuclo'

let runs = 0

export const RunCounter = () =>
  div(
    // A side effect on purpose, to count the runs.
    // Keep real dynamic values pure.
    p(() => \`This dynamic value has run \${++runs} times.\`),
    button('update()', { onClick: () => update() }),
  )
`, Update),

  demo("api-scope", "scope()", "Both buttons add an item and rename the user. update('cart') refreshes only the scoped panel.", `
import 'nuclo'

const names = ['Ada', 'Grace', 'Alan', 'Linus']
const cartItems: string[] = []
let user = 'Ada'

function change() {
  cartItems.push('apple')
  user = names[cartItems.length % names.length]
}

export const Shop = () =>
  div(
    div(() => \`Hi, \${user}\`),
    div(scope('cart'), () => \`Items: \${cartItems.length}\`),
    button("update('cart')", {
      onClick: () => { change(); update('cart') },
    }),
    button('update()', {
      onClick: () => { change(); update() },
    }),
  )
`, Scope),

  demo("api-when", "when()", "The first true condition wins; otherwise .else() renders. A new branch is built from scratch.", `
import 'nuclo'

type Status = 'loading' | 'error' | 'ready'
let status: Status = 'loading'

const pick = (next: Status) =>
  button(next, {
    'aria-pressed': () => String(status === next),
    onClick: () => { status = next; update() },
  })

export const StatusView = () =>
  div(
    pick('loading'), pick('error'), pick('ready'),
    when(() => status === 'loading', p('Loading…'))
      .when(() => status === 'error', p('Something went wrong'))
      .else(p('Ready')),
  )
`, When),

  demo("api-list", "list()", "Rows are matched by identity. Check a row, then Reverse: the same <li> moves, checkbox and all.", `
import 'nuclo'

const pool = ['Cherry', 'Date', 'Elderberry', 'Fig', 'Grape']
let next = 0
const fruits = [
  { name: 'Apple', done: false },
  { name: 'Banana', done: false },
]

function add() {
  fruits.push({ name: pool[next++ % pool.length], done: false })
  update()
}

export const Fruits = () =>
  div(
    button('Add', { onClick: add }),
    button('Reverse', { onClick: () => { fruits.reverse(); update() } }),
    button('Remove first', { onClick: () => { fruits.shift(); update() } }),
    ul(
      list(() => fruits, (fruit) =>
        li(
          label(
            input({
              type: 'checkbox',
              checked: () => fruit.done,
              onChange: () => { fruit.done = !fruit.done; update() },
            }),
            span(
              { className: () => (fruit.done ? 'done' : '') },
              () => fruit.name,
            ),
          ),
        ),
      ),
    ),
  )
`, List),

  demo("api-region", "region() & into()", "A layout with a stacked main region and a side region, filled from outside it. Type into Home, open the dialog and close it: the text stays. Article fills both regions with one into().", `
import 'nuclo'

let page: 'home' | 'article' | null = 'home'
let dialog = false

const go = (next: typeof page) => () => {
  page = next
  dialog = false
  update()
}

const Layout = () =>
  div(
    nav(
      button('Home', { onClick: go('home') }),
      button('Article', { onClick: go('article') }),
      button('Close page', { onClick: go(null) }),
    ),
    main(
      region({ id: 'main', type: 'stack', empty: p('Nothing open.') }),
    ),
    aside(region({ id: 'side', empty: p('No related links.') })),
  )

// Pages fill the layout's regions from outside it.
const Home = () =>
  into('main',
    input({ placeholder: 'Type here, then open the dialog' }),
    button('Open dialog', {
      onClick: () => { dialog = true; update() },
    }),
  )

const Article = () =>
  into({
    main: article(h2('Article'), p('One into() fills both regions.')),
    side: [h2('Related'), ul(li('One'), li('Two'))],
  })

// Stacks over Home, so Home keeps its DOM and the text you typed.
const Dialog = () =>
  into('main',
    div(
      p('On top of Home.'),
      button('Close', { onClick: () => { dialog = false; update() } }),
    ),
  )

export const RegionApp = () =>
  div(
    Layout(),
    when(() => page === 'home', Home()),
    when(() => page === 'article', Article()),
    when(() => dialog, Dialog()),
  )
`, Region),

  demo("api-force-update", "forceUpdate()", "update() refreshes only the dynamic lang line. forceUpdate() calls App again and patches the same <h1>. The explicit form rebuilds only this tree, not the whole page.", `
import 'nuclo'

const labels = {
  en: { title: 'Hello', body: 'Static text, fixed on build.' },
  pt: { title: 'Olá', body: 'Texto estático, fixado na criação.' },
}
let lang: keyof typeof labels = 'en'
let host: Element | undefined

const App = () => div(h1(labels[lang].title), p(labels[lang].body))

export const LanguageSwitch = () =>
  div(
    p(() => \`lang = '\${lang}'\`),
    div({ onMount: (el) => { host = el as unknown as Element } }, App()),
    button('Switch lang, update()', {
      onClick: () => { lang = lang === 'en' ? 'pt' : 'en'; update() },
    }),
    button('forceUpdate(App(), host)', {
      onClick: () => { if (host) forceUpdate(App(), host) },
    }),
  )
`, ForceUpdate),
];

const DEMOS = new Map(API_DEMOS.map((d) => [d.id, d]));

/** The docs section's demo in a "Live" frame, captioned with its description. */
export function Live(id: string) {
  const d = DEMOS.get(id)!;
  return div(
    ls.frame,
    div(
      ls.head,
      span(ls.badge, "Live"),
      span(...withCode(d.desc)),
      a(ls.open, { href: exampleHref(d.id, "docs"), title: "Open this example full screen", onClick: onOpenExample(d.id, "docs") }, "Open ↗"),
    ),
    div(ls.body, d.preview()),
  );
}
