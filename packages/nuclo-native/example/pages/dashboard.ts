import { body, card, chip, color, heading, muted, row } from "../ui";

interface Point {
  label: string;
  value: number;
}

const points = (labels: string, values: number[]): Point[] =>
  labels.split(" ").map((label, i) => ({ label, value: values[i] }));

// Stable objects: list() keeps a bar's widgets while its point stays in the list.
const ranges: Record<string, Point[]> = {
  Week: points("Mon Tue Wed Thu Fri Sat Sun", [3200, 4100, 3800, 5200, 6100, 7400, 4600]),
  Month: points("W1 W2 W3 W4", [24800, 31200, 28700, 36900]),
  Year: points("Q1 Q2 Q3 Q4", [312000, 358000, 401000, 467000]),
};

const sources = [
  { name: "Direct", share: 42, tint: "#4f46e5" },
  { name: "Search", share: 31, tint: "#0ea5e9" },
  { name: "Social", share: 18, tint: "#f59e0b" },
  { name: "Email", share: 9, tint: "#10b981" },
];

const CHART_HEIGHT = 130;

let range = "Week";
let selected: Point | null = null;

const data = () => ranges[range];
const total = () => data().reduce((sum, point) => sum + point.value, 0);
const peak = () => Math.max(...data().map((point) => point.value));
const money = (value: number) => (value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value}`);

const stat = (label: string, value: () => string, trend: string, up: boolean) =>
  div(
    { style: { backgroundColor: color.card, borderRadius: 14, padding: 12, gap: 4, flex: 1 } },
    muted(label, 12),
    heading(value, 17),
    span(trend, { style: { color: up ? color.good : color.bad, fontSize: 12, fontWeight: "bold" } }),
  );

const bar = (point: Point) =>
  div(
    {
      style: { flex: 1, gap: 6 },
      onClick: () => {
        selected = selected === point ? null : point;
        update();
      },
    },
    div({
      style: () => ({
        height: Math.round((point.value / peak()) * CHART_HEIGHT),
        borderRadius: 6,
        backgroundColor: selected === point ? color.accent : selected ? color.accentSoft : "#818cf8",
      }),
    }),
    span(point.label, { style: { color: color.muted, fontSize: 11, textAlign: "center" } }),
  );

export const Dashboard = () =>
  div(
    { style: { gap: 14, padding: 16 } },
    div(
      { style: row },
      stat("Revenue", () => money(total()), "▲ 12.4%", true),
      stat("Orders", () => String(Math.round(total() / 38)), "▲ 4.1%", true),
      stat("Refunds", () => `${(1.4 + data().length / 10).toFixed(1)}%`, "▼ 0.3%", false),
    ),
    card(
      div(
        { style: row },
        div(
          { style: { flex: 1, gap: 2 } },
          heading("Revenue"),
          muted(() => (selected ? `${selected.label} · ${money(selected.value)}` : "Tap a bar for details")),
        ),
      ),
      div(
        { style: { flexDirection: "row", gap: 8 } },
        ...Object.keys(ranges).map((name) =>
          chip(name, () => range === name, () => {
            range = name;
            selected = null;
            update();
          }),
        ),
      ),
      div({ style: { flexDirection: "row", gap: 8, alignItems: "flex-end", height: CHART_HEIGHT + 24 } }, list(data, bar)),
    ),
    card(
      heading("Traffic sources"),
      ...sources.map((source) =>
        div(
          { style: row },
          span(source.name, { style: { color: color.text, fontSize: 13, width: 56 } }),
          div({ style: { width: source.share * 4, height: 10, borderRadius: 5, backgroundColor: source.tint } }),
          body(`${source.share}%`),
        ),
      ),
    ),
  );
