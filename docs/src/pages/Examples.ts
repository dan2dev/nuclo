import { css, cx, s } from "../styles.ts";
import { EXAMPLES } from "../content/examples.ts";
import { CodeBlock } from "../components/CodeBlock.ts";
import { cardDelay, es, statusDotStyle } from "./examples/styles.ts";
import { StylingGallery } from "./examples/styling-gallery.ts";


function ExampleCard(ex: typeof EXAMPLES[number], index: number) {
  let activeTab: "preview" | "code" = "preview";

  function Tab(label: string, tab: "preview" | "code") {
    return button(
      es.tab,
      {
        class: () => cx(es.tab, activeTab === tab ? es.tabActive : null).className,
      },
      label,
      on("click", () => { activeTab = tab; update(); }),
    );
  }

  return div(
    es.card,
    cardDelay(index),
    div(
      es.cardTop,
      div(
        es.cardMetaRow,
        div(es.cardBadge, "● Live"),
        div(es.cardNumber, String(index + 1).padStart(2, "0")),
      ),
      div(es.cardTitle, ex.title),
      div(es.cardDesc, ex.desc),
    ),
    div(
      es.tabs,
      Tab("Preview", "preview"),
      Tab("Code", "code"),
    ),
    // Preview pane
    div(
      es.pane,
      { class: () => cx(es.pane, activeTab === "preview" ? es.paneActive : null).className },
      div(
        es.previewPane,
        buildPreview(ex.id),
      ),
    ),
    // Code pane
    div(
      es.pane,
      { class: () => cx(es.pane, activeTab === "code" ? es.codePaneActive : null).className },
      CodeBlock({ filename: `${ex.title.replace(/\s+/g, "")}.ts`, code: ex.code }),
    ),
  );
}

function buildPreview(id: string) {
  switch (id) {
    case "counter": return CounterDemo();
    case "todo":    return TodoDemo();
    case "search":  return SearchDemo();
    case "async":   return AsyncDemo();
    case "styling": return StyleDemo();
    case "chart":   return ChartDemo();
    default:        return div();
  }
}

// ── Counter demo ──────────────────────────────────────────────────────────────
function CounterDemo() {
  let count = 0;
  return div(
    es.counter,
    div(es.countValue, () => String(count)),
    div(es.countLabel, "COUNT"),
    div(
      es.buttonRow,
      button(
        es.button,
        "−",
        on("click", () => { count--; update(); }),
      ),
      button(
        es.button,
        es.buttonPrimary,
        "Reset",
        on("click", () => { count = 0; update(); }),
      ),
      button(
        es.button,
        "+",
        on("click", () => { count++; update(); }),
      ),
    ),
  );
}

// ── Todo demo ─────────────────────────────────────────────────────────────────
function TodoDemo() {
  let todos: { id: number; text: string; done: boolean }[] = [];
  let filter: "all" | "active" | "done" = "all";
  let nextId = 1;
  let inputValue = "";
  let domInput: HTMLInputElement | null = null;

  const inputEl = input(
    es.input,
    { type: "text", placeholder: "Add a task…" } as any,
    on("input", (e) => { inputValue = (e.target as HTMLInputElement).value; }),
    on("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter") addTodo(); }),
    ((el: any) => { domInput = el; }) as any,
  );

  function visible() {
    if (filter === "active") return todos.filter(t => !t.done);
    if (filter === "done")   return todos.filter(t => t.done);
    return todos;
  }

  function addTodo() {
    const v = inputValue.trim();
    if (!v) return;
    todos.push({ id: nextId++, text: v, done: false });
    inputValue = "";
    if (domInput) domInput.value = "";
    update();
  }

  function FilterBtn(label: string, f: "all" | "active" | "done") {
    return button(
      es.filter,
      { class: () => cx(es.filter, filter === f ? es.filterActive : null).className },
      label,
      on("click", () => { filter = f; update(); }),
    );
  }

  return div(
    es.todo,
    div(
      es.row,
      inputEl,
      button(
        es.button,
        es.buttonPrimary,
        "Add",
        on("click", addTodo),
      ),
    ),
    div(
      es.filters,
      FilterBtn("All", "all"),
      FilterBtn("Active", "active"),
      FilterBtn("Done", "done"),
    ),
    div(
      es.list,
      list(
        () => visible(),
        (t) => div(
          es.item,
          input(
            { type: "checkbox" },
            { checked: () => t.done },
            on("change", () => { t.done = !t.done; update(); }),
          ),
          span(es.itemText, { class: () => cx(es.itemText, t.done ? es.itemDoneText : null).className }, t.text),
          button(
            es.itemDelete,
            "×",
            on("click", () => {
              todos = todos.filter(x => x.id !== t.id);
              update();
            }),
          ),
        ),
      ),
      when(
        () => visible().length === 0,
        div(es.empty, "No tasks yet."),
      ),
    ),
    div(
      es.countSummary,
      () => {
        const remaining = todos.filter(t => !t.done).length;
        return `${remaining} of ${todos.length} remaining`;
      },
    ),
  );
}

// ── Search demo ───────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { name: "Alice Chen",    email: "alice@example.com",   initials: "AC" },
  { name: "Bob Smith",     email: "bob@example.com",     initials: "BS" },
  { name: "Charlie Davis", email: "charlie@example.com", initials: "CD" },
  { name: "Diana Park",    email: "diana@example.com",   initials: "DP" },
  { name: "Ethan Moore",   email: "ethan@example.com",   initials: "EM" },
];

function SearchDemo() {
  let query = "";

  function results() {
    const q = query.toLowerCase();
    if (!q) return MOCK_USERS;
    return MOCK_USERS.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  return div(
    es.search,
    input(
      es.input,
      es.searchInput,
      {
        type: "text",
        placeholder: "Search users…",
      },
      on("input", (e) => {
        query = (e.target as HTMLInputElement).value;
        update();
      }),
    ),
    div(
      list(
        () => results(),
        (u) => div(
          es.userCard,
          div(es.avatar, u.initials),
          div(
            div(es.userName, u.name),
            div(es.userEmail, u.email),
          ),
        ),
      ),
      when(
        () => results().length === 0,
        div(es.noResults, "No users found."),
      ),
    ),
  );
}

// ── Async demo ────────────────────────────────────────────────────────────────
interface Product { id: number; title: string; category: string; }

function AsyncDemo() {
  type Status = "idle" | "loading" | "success" | "error";
  let status: Status = "idle";
  let products: Product[] = [];
  let errMsg = "";

  async function loadData() {
    status = "loading"; update();
    try {
      const res = await fetch("https://dummyjson.com/products?limit=3&select=title,category");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { products: Product[] };
      products = data.products;
      status = "success";
    } catch (e) {
      errMsg = e instanceof Error ? e.message : "Unknown error";
      status = "error";
    }
    update();
  }

  return div(
    es.asyncRoot,
    div(
      es.statusBar,
      div(es.statusDot, { class: () => cx(es.statusDot, statusDotStyle(status)).className }),
      span(() => {
        if (status === "idle")    return "Ready to fetch";
        if (status === "loading") return "Fetching…";
        if (status === "success") return `Loaded ${products.length} products`;
        return "Error occurred";
      }),
    ),
    button(
      es.button,
      es.buttonPrimary,
      {
        class: () => cx(es.button, es.buttonPrimary, status === "loading" ? es.buttonDisabled : null).className,
        disabled: () => status === "loading",
      },
      () => status === "loading" ? "Loading…" : "Fetch Data",
      on("click", loadData),
    ),
    when(
      () => status === "success",
      div(
        css({ marginTop: "12px" }),
        list(
          () => products,
          (p) => div(
            es.productCard,
            div(es.productTitle, p.title),
            div(es.productCat, p.category),
          ),
        ),
      ),
    ),
    when(
      () => status === "error",
      div(
        es.errorMsg,
        css({ marginTop: "12px" }),
        () => `Error: ${errMsg}`,
      ),
    ),
  );
}

// ── Styling demo ──────────────────────────────────────────────────────────────
const { css: demoCSS, cx: demoCX } = createCss({
  colors: {
    primary: "#14b8a6",
    primaryHover: "#0f766e",
    text: "#1f2937",
    muted: "#6b7280",
    surface: "#f8fafc",
    border: "#e2e8f0",
  },
  screens: { sm: "(min-width: 480px)" },
});

const demoChip = demoCSS({
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 14px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  border: "2px solid transparent",
  transition: "all 0.15s",
  sm: { padding: "6px 18px" },
});
const demoChipDefault = demoCSS({
  backgroundColor: "#f8fafc",
  color: "#6b7280",
  borderColor: "#e2e8f0",
  hover: { color: "#1f2937", borderColor: "#14b8a6" },
});
const demoChipActive = demoCSS({
  backgroundColor: "#14b8a6",
  color: "white",
  borderColor: "#0f766e",
  hover: { backgroundColor: "#0f766e" },
});

function StyleDemo() {
  const TAGS = ["TypeScript", "Atomic CSS", "Tokens", "cx()", "Screens", "SSR"];
  let selected = new Set<string>();

  function toggle(tag: string) {
    if (selected.has(tag)) selected.delete(tag);
    else selected.add(tag);
    update();
  }

  return div(
    es.styleDemo,
    p(es.styleHint,
      "Click tags to toggle them. Active tags use the ",
      code("primary"),
      " color token — ",
      code("cx()"),
      " resolves conflicts per property.",
    ),
    div(
      es.styleChips,
      ...TAGS.map(tag =>
        button(
          { class: () => demoCX(demoChip, selected.has(tag) ? demoChipActive : demoChipDefault).className },
          tag,
          on("click", () => toggle(tag)),
        ),
      ),
    ),
    p(es.styleResult,
      () => selected.size > 0
        ? `Selected: ${[...selected].join(", ")}`
        : "Nothing selected yet.",
    ),
  );
}

// ── Chart demo ───────────────────────────────────────────────────────────────
const CHART_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let chartData = [42, 78, 55, 91, 64, 83, 37];

const CHART_COLORS = [
  "#14b8a6", "#38bdf8", "#f59e0b",
  "#fb7185", "#a78bfa", "#34d399", "#f97316",
];

const ANIM_MS = 420;
let animId = 0;
let chartFrame = 0;

type PieSlice = {
  d: string;
  color: string;
  value: number;
  midX: number;
  midY: number;
};

let cachedPieFrame = -1;
let cachedPieSlices: PieSlice[] = [];

function chartValue(i: number) {
  return Math.round(chartData[i]);
}

function randomizeChartData() {
  const from = [...chartData];
  const to = CHART_LABELS.map(() => 10 + Math.floor(Math.random() * 90));
  const start = performance.now();
  cancelAnimationFrame(animId);

  function tick(now: number) {
    const t = Math.min((now - start) / ANIM_MS, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    for (let i = 0; i < from.length; i++) {
      chartData[i] = t === 1 ? to[i] : from[i] + (to[i] - from[i]) * ease;
    }
    chartFrame++;
    update();
    if (t < 1) animId = requestAnimationFrame(tick);
  }
  animId = requestAnimationFrame(tick);
}

function BarChart() {
  const W = 320, H = 180, PAD = 32, BAR_GAP = 8;
  const barW = (W - PAD * 2 - BAR_GAP * (CHART_LABELS.length - 1)) / CHART_LABELS.length;
  const chartH = H - PAD - 24;

  return svgSvg(
    { viewBox: `0 0 ${W} ${H}`, width: "100%", height: "100%", class: es.chartSvg.className },
    list(
      () => CHART_LABELS,
      (label, i) => {
        const x = PAD + i * (barW + BAR_GAP);
        return gSvg(
          rectSvg({
            x: String(x),
            y: () => { const max = Math.max(...chartData); return String(PAD + chartH - (chartData[i] / max) * chartH); },
            width: String(barW),
            height: () => { const max = Math.max(...chartData); return String((chartData[i] / max) * chartH); },
            rx: "3", fill: CHART_COLORS[i], opacity: "0.85",
          }, es.chartAnimatedShape),
          textSvg(
            {
              x: String(x + barW / 2), y: String(H - 4),
              "text-anchor": "middle",
              fill: "var(--c-text-muted)", "font-size": "9",
              "font-family": "'Space Grotesk', sans-serif",
            },
            label,
          ),
          textSvg(
            {
              x: String(x + barW / 2),
              y: () => { const max = Math.max(...chartData); return String(PAD + chartH - (chartData[i] / max) * chartH - 5); },
              "text-anchor": "middle",
              fill: "var(--c-text-dim)", "font-size": "9",
              "font-family": "'JetBrains Mono', monospace",
            },
            () => String(chartValue(i)),
          ),
        );
      },
    ),
  );
}

function chartPoints() {
  const W = 320, H = 180, PAD = 32;
  const chartH = H - PAD - 24;
  const stepX = (W - PAD * 2) / (CHART_LABELS.length - 1);
  const max = Math.max(...chartData);
  return CHART_LABELS.map((label, i) => ({
    label,
    value: chartData[i],
    x: PAD + i * stepX,
    y: PAD + chartH - (chartData[i] / max) * chartH,
  }));
}

function chartPoint(index: number) {
  const W = 320, H = 180, PAD = 32;
  const chartH = H - PAD - 24;
  const stepX = (W - PAD * 2) / (CHART_LABELS.length - 1);
  const max = Math.max(...chartData);
  return {
    x: PAD + index * stepX,
    y: PAD + chartH - (chartData[index] / max) * chartH,
  };
}

function LineChart() {
  const W = 320, H = 180, PAD = 32;
  const chartH = H - PAD - 24;

  return svgSvg(
    { viewBox: `0 0 ${W} ${H}`, width: "100%", height: "100%", class: es.chartSvg.className },
    pathSvg({
      d: () => {
        const pts = chartPoints();
        return `M${pts[0].x},${PAD + chartH} ${pts.map(p => `L${p.x},${p.y}`).join(" ")} L${pts[pts.length - 1].x},${PAD + chartH} Z`;
      },
      fill: "var(--c-primary)", opacity: "0.1",
    }),
    polylineSvg({
      points: () => chartPoints().map(p => `${p.x},${p.y}`).join(" "),
      fill: "none",
      stroke: "var(--c-primary)", "stroke-width": "2.5",
      "stroke-linejoin": "round", "stroke-linecap": "round",
    }, es.chartAnimatedShape),
    list(
      () => CHART_LABELS,
      (label, i) => gSvg(
        circleSvg({
          cx: () => String(chartPoint(i).x), cy: () => String(chartPoint(i).y), r: "4",
          fill: "var(--c-bg-card)", stroke: "var(--c-primary)", "stroke-width": "2",
        }, es.chartAnimatedShape),
        textSvg(
          {
            x: () => String(chartPoint(i).x), y: String(H - 4),
            "text-anchor": "middle",
            fill: "var(--c-text-muted)", "font-size": "9",
            "font-family": "'Space Grotesk', sans-serif",
          },
          label,
        ),
        textSvg(
          {
            x: () => String(chartPoint(i).x), y: () => String(chartPoint(i).y - 9),
            "text-anchor": "middle",
            fill: "var(--c-text-dim)", "font-size": "9",
            "font-family": "'JetBrains Mono', monospace",
          },
          () => String(chartValue(i)),
        ),
      ),
    ),
  );
}

function pieSlices() {
  if (cachedPieFrame === chartFrame) return cachedPieSlices;

  const CX = 160, CY = 90, R = 70;
  const total = chartData.reduce((s, v) => s + v, 0);
  let angle = -Math.PI / 2;
  cachedPieSlices = chartData.map((v, i) => {
    const sweep = (v / total) * Math.PI * 2;
    const x1 = CX + R * Math.cos(angle);
    const y1 = CY + R * Math.sin(angle);
    const x2 = CX + R * Math.cos(angle + sweep);
    const y2 = CY + R * Math.sin(angle + sweep);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const midAngle = angle + sweep / 2;
    const sl = {
      d: `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${largeArc},1 ${x2},${y2} Z`,
      color: CHART_COLORS[i],
      value: v,
      midX: CX + (R * 0.65) * Math.cos(midAngle),
      midY: CY + (R * 0.65) * Math.sin(midAngle),
    };
    angle += sweep;
    return sl;
  });
  cachedPieFrame = chartFrame;
  return cachedPieSlices;
}

function PieChart() {
  return svgSvg(
    { viewBox: "0 0 320 180", width: "100%", height: "100%", class: es.chartSvg.className },
    list(
      () => CHART_LABELS,
      (_label, i) => gSvg(
        pathSvg({
          d: () => pieSlices()[i].d,
          fill: CHART_COLORS[i], opacity: "0.85",
          stroke: "var(--c-bg-code)", "stroke-width": "1.5",
        }, es.chartAnimatedShape),
        textSvg(
          {
            x: () => String(pieSlices()[i].midX), y: () => String(pieSlices()[i].midY + 3),
            "text-anchor": "middle",
            fill: "#fff", "font-size": "8", "font-weight": "600",
            "font-family": "'JetBrains Mono', monospace",
          },
          () => String(chartValue(i)),
        ),
      ),
    ),
  );
}

function ChartDemo() {
  type ChartType = "bar" | "line" | "pie";
  let chartType: ChartType = "bar";

  return div(
    es.chartRoot,
    div(
      es.chartControls,
      label(es.chartLabel, "Chart Type"),
      select(
        es.chartSelect,
        option({ value: "bar" }, "Bar"),
        option({ value: "line" }, "Line"),
        option({ value: "pie" }, "Pie"),
        on("change", (e) => {
          chartType = (e.target as HTMLSelectElement).value as ChartType;
          update();
        }),
      ),
      button(
        es.button,
        "Randomize",
        on("click", randomizeChartData),
      ),
    ),
    div(
      es.chartArea,
      when(() => chartType === "bar", BarChart()),
      when(() => chartType === "line", LineChart()),
      when(() => chartType === "pie", PieChart()),
    ),
  );
}

// ── Examples page ─────────────────────────────────────────────────────────────
export function ExamplesPage() {
  const pageHeader = div(
    es.hero,
    div(
      s.container,
      div(
        es.heroInner,
        div(
          div(es.kicker, "Examples"),
          h1(es.title, "Practical examples. Live demos."),
          p(
            es.lead,
            "Explore Nuclo patterns with interactive previews and the source code beside each behavior.",
          ),
        ),
        div(
          es.facts,
        ),
      ),
    ),
  );

  return div(
    { id: "examples-page" },
    pageHeader,
    div(
      s.container,
      div(
        es.grid,
        ...EXAMPLES.map((ex, index) => ExampleCard(ex, index)),
      ),
    ),
    StylingGallery(),
  );
}
