/**
 * Layouts and transitions: one dashboard screen laid out by the same flex algorithm on every target.
 *
 *   Header     a row, overlapping avatars (negative margins, zIndex) and an absolute badge
 *   Segments   a thumb that slides under the labels (translateX + a spring transition)
 *   Metrics    a 2 × 2 grid of flex: 1 cards
 *   Chart      bars whose height animates, staggered by transitionDelay
 *   Carousel   overflow: "scroll" on a row, cards sized by aspectRatio, onScroll for the page dots
 *   Tags       flexWrap, with a pressed style
 *   Questions  an accordion: the height and the chevron's rotation are transitions
 *   Button     a second render() layer over the screen, with a shadow
 */
import { type Style, css, div, h1, h2, list, p, render, scope, small, span, strong, update } from "../../src/index.ts";

type Range = "week" | "month" | "year";

interface Metric {
  label: string;
  week: string;
  month: string;
  year: string;
  up: boolean;
}

interface Bar {
  label: string;
  week: number;
  month: number;
  year: number;
}

interface Slide {
  title: string;
  caption: string;
  color: string;
}

interface Tag {
  name: string;
  on: boolean;
}

interface Question {
  title: string;
  answer: string;
  open: boolean;
}

const RANGES: Range[] = ["week", "month", "year"];
const SEGMENT = 96;
const SLIDE = 240;

let range: Range = "week";
let selectedBar = 2;
let page = 0;
let accent = 0;
const ACCENTS = ["#4f46e5", "#0d9488", "#db2777"];

const metrics: Metric[] = [
  { label: "Revenue", week: "$12.4k", month: "$48.9k", year: "$611k", up: true },
  { label: "Orders", week: "318", month: "1,204", year: "15,380", up: true },
  { label: "Refunds", week: "7", month: "31", year: "402", up: false },
  { label: "Rating", week: "4.8", month: "4.7", year: "4.7", up: true },
];

const bars: Bar[] = [
  { label: "Mon", week: 42, month: 88, year: 61 },
  { label: "Tue", week: 68, month: 54, year: 72 },
  { label: "Wed", week: 96, month: 71, year: 80 },
  { label: "Thu", week: 57, month: 100, year: 66 },
  { label: "Fri", week: 83, month: 63, year: 94 },
  { label: "Sat", week: 31, month: 47, year: 58 },
  { label: "Sun", week: 49, month: 79, year: 43 },
];

const slides: Slide[] = [
  { title: "Spring drop", caption: "24 new arrivals", color: "#4f46e5" },
  { title: "Free shipping", caption: "On orders over $40", color: "#0d9488" },
  { title: "Members", caption: "Early access on Friday", color: "#db2777" },
  { title: "Clearance", caption: "Up to 60% off", color: "#ea580c" },
];

const tags: Tag[] = [
  { name: "Shoes", on: true },
  { name: "Outerwear", on: false },
  { name: "Accessories", on: true },
  { name: "Denim", on: false },
  { name: "Sale", on: false },
  { name: "New in", on: true },
  { name: "Sportswear", on: false },
];

const questions: Question[] = [
  { title: "How is the layout computed?", answer: "One flex algorithm, written once per platform, gives every target the same boxes for the same styles.", open: true },
  { title: "What animates?", answer: "Opacity, transforms, colours, corner radius and a box's width or height, when the style has a transition.", open: false },
  { title: "Is there a virtual DOM?", answer: "No. Views are built once; update() re-runs the dynamic values and touches only what changed.", open: false },
];

function accentColor(): string {
  return ACCENTS[accent % ACCENTS.length] ?? "#4f46e5";
}

function metricValue(metric: Metric): string {
  return range === "week" ? metric.week : range === "month" ? metric.month : metric.year;
}

function barValue(bar: Bar): number {
  return range === "week" ? bar.week : range === "month" ? bar.month : bar.year;
}

const page_: Style = { padding: 20, paddingBottom: 96, gap: 20, backgroundColor: "#f8fafc" };
const card = css({ padding: 16, gap: 12, backgroundColor: "#ffffff", borderRadius: 18, shadowRadius: 16, shadowOffsetY: 6, shadowColor: "#0f172a14" });
const muted = css({ color: "#64748b", fontSize: 13 });
const row = css({ flexDirection: "row", alignItems: "center" });

const Avatar = (initials: string, color: string, index: number) =>
  div(
    {
      style: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#f8fafc",
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: index === 0 ? 0 : -12,
        zIndex: 10 - index,
      },
    },
    span(initials, { style: { color: "#ffffff", fontSize: 13, fontWeight: "bold" } }),
  );

const Header = () =>
  div(
    row,
    div({ style: { flex: 1, gap: 2 } }, small("Saturday, 14 November", muted), h1("Overview", { style: { fontSize: 30 } })),
    div(
      row,
      Avatar("AL", "#4f46e5", 0),
      Avatar("GH", "#0d9488", 1),
      Avatar("MH", "#db2777", 2),
      div(
        { style: { position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center", zIndex: 20 } },
        span("3", { style: { color: "#ffffff", fontSize: 11, fontWeight: "bold" } }),
      ),
    ),
  );

const Segment = (value: Range, index: number) =>
  div(
    {
      style: { width: SEGMENT, height: 36, alignItems: "center", justifyContent: "center", zIndex: 1 },
      onClick: () => {
        range = value;
        update("dashboard");
      },
    },
    span(value === "week" ? "Week" : value === "month" ? "Month" : "Year", {
      style: () => ({ fontWeight: "bold", fontSize: 14, color: RANGES.indexOf(range) === index ? "#0f172a" : "#64748b" }),
    }),
  );

const Segments = () =>
  div(
    { style: { flexDirection: "row", padding: 4, borderRadius: 14, backgroundColor: "#e2e8f0", alignSelf: "flex-start" } },
    div({
      style: () => ({
        position: "absolute",
        top: 4,
        left: 4,
        width: SEGMENT,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#ffffff",
        shadowRadius: 6,
        shadowOffsetY: 2,
        shadowColor: "#0f172a26",
        translateX: RANGES.indexOf(range) * SEGMENT,
        transitionDuration: 420,
        transitionEasing: "spring",
      }),
    }),
    Segment("week", 0),
    Segment("month", 1),
    Segment("year", 2),
  );

const MetricCard = (metric: Metric) =>
  div(
    card,
    { style: { flex: 1, gap: 6 } },
    small(metric.label, muted),
    strong(() => metricValue(metric), { style: { fontSize: 24 } }),
    div(
      { style: { alignSelf: "flex-start", paddingLeft: 8, paddingRight: 8, paddingTop: 3, paddingBottom: 3, borderRadius: 999, backgroundColor: metric.up ? "#dcfce7" : "#fee2e2" } },
      span(metric.up ? "▲ up" : "▼ down", { style: { fontSize: 11, fontWeight: "bold", color: metric.up ? "#15803d" : "#b91c1c" } }),
    ),
  );

const Metrics = () =>
  div(
    { style: { gap: 12 } },
    div({ style: { flexDirection: "row", gap: 12 } }, MetricCard(metrics[0]!), MetricCard(metrics[1]!)),
    div({ style: { flexDirection: "row", gap: 12 } }, MetricCard(metrics[2]!), MetricCard(metrics[3]!)),
  );

const ChartBar = (bar: Bar, index: number) =>
  div(
    {
      style: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 6 },
      onClick: () => {
        selectedBar = index;
        update("dashboard");
      },
    },
    small(() => (selectedBar === index ? `${barValue(bar)}` : ""), { style: { fontWeight: "bold", color: "#0f172a" } }),
    div({
      style: () => ({
        width: 22,
        height: barValue(bar) * 1.3,
        borderRadius: 7,
        backgroundColor: selectedBar === index ? accentColor() : "#cbd5e1",
        transitionDuration: 420,
        transitionDelay: index * 35,
        transitionEasing: "ease-out",
      }),
    }),
    small(bar.label, muted),
  );

const Chart = () =>
  div(
    card,
    div(row, h2("Sales", { style: { flex: 1 } }), small(() => `per day · ${range}`, muted)),
    div({ style: { flexDirection: "row", height: 190, alignItems: "stretch" } }, list(() => bars, (bar, index) => ChartBar(bar, index))),
  );

const SlideCard = (slide: Slide) =>
  div(
    { style: { width: SLIDE, aspectRatio: 1.6, borderRadius: 18, padding: 16, justifyContent: "flex-end", gap: 2, backgroundColor: slide.color } },
    strong(slide.title, { style: { color: "#ffffff", fontSize: 20 } }),
    small(slide.caption, { style: { color: "#ffffffcc" } }),
  );

const Dot = (index: number) =>
  div({
    style: () => ({
      width: page === index ? 18 : 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: page === index ? "#0f172a" : "#cbd5e1",
      transitionDuration: 200,
    }),
  });

const Carousel = () =>
  div(
    { style: { gap: 10 } },
    h2("Campaigns"),
    div(
      {
        style: { flexDirection: "row", gap: 12, overflow: "scroll", marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 },
        onScroll: (e) => {
          const next = Math.round(e.scrollLeft / (SLIDE + 12));
          if (next !== page) {
            page = next;
            update("dots");
          }
        },
      },
      list(() => slides, (slide) => SlideCard(slide)),
    ),
    div(scope("dots"), { style: { flexDirection: "row", gap: 6, justifyContent: "center" } }, Dot(0), Dot(1), Dot(2), Dot(3)),
  );

const TagChip = (tag: Tag) =>
  div(
    {
      style: () => ({
        paddingLeft: 14,
        paddingRight: 14,
        paddingTop: 8,
        paddingBottom: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: tag.on ? accentColor() : "#cbd5e1",
        backgroundColor: tag.on ? accentColor() : "#ffffff",
        transitionDuration: 180,
        pressed: { scale: 0.94 },
      }),
      onClick: () => {
        tag.on = !tag.on;
        update("dashboard");
      },
    },
    span(tag.name, { style: () => ({ fontSize: 13, fontWeight: "bold", color: tag.on ? "#ffffff" : "#334155" }) }),
  );

const Tags = () =>
  div(card, h2("Filters"), div({ style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } }, list(() => tags, (tag) => TagChip(tag))));

const QuestionItem = (question: Question) =>
  div(
    {
      style: () => ({
        height: question.open ? 124 : 48,
        overflow: "hidden",
        borderRadius: 12,
        backgroundColor: "#f1f5f9",
        transitionDuration: 280,
        transitionEasing: "ease-in-out",
      }),
    },
    div(
      {
        style: { flexDirection: "row", alignItems: "center", height: 48, paddingLeft: 14, paddingRight: 14 },
        onClick: () => {
          question.open = !question.open;
          update("dashboard");
        },
      },
      strong(question.title, { style: { flex: 1, fontSize: 14 } }),
      span("⌄", { style: () => ({ fontSize: 18, color: "#64748b", rotate: question.open ? 180 : 0, transitionDuration: 280 }) }),
    ),
    p(question.answer, muted, { style: { paddingLeft: 14, paddingRight: 14, lineHeight: 19 } }),
  );

const Questions = () => div(card, h2("Questions"), list(() => questions, (question) => QuestionItem(question)));

const App = () => div(scope("dashboard"), { style: page_ }, Header(), Segments(), Metrics(), Chart(), Carousel(), Tags(), Questions());

/** A layer over the screen: touches pass through it everywhere but on the button. */
const Floating = () =>
  div(
    div(
      {
        style: () => ({
          position: "absolute",
          right: 20,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: accentColor(),
          shadowRadius: 18,
          shadowOffsetY: 8,
          shadowColor: "#0f172a4d",
          transitionDuration: 220,
          pressed: { scale: 0.9 },
        }),
        ariaLabel: "Change the accent colour",
        onClick: () => {
          accent++;
          update();
        },
      },
      span("✦", { style: { color: "#ffffff", fontSize: 22 } }),
    ),
  );

render(App);
render(Floating);
