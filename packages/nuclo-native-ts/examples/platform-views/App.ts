/**
 * Platform views a phone app reaches for, typed and placed like any nuclo node:
 *
 *   WebView({ url, onLoad })        WKWebView (iOS, macOS), android.webkit.WebView, an <iframe>; on Linux (GTK, GPUI),
 *                                   which embed no browser, the page's title and text as fetched
 *   DatePicker({ value, onChange }) UIDatePicker (compact), NSDatePicker, Android's DatePickerDialog, a GtkCalendar,
 *                                   <input type="date">; on GPUI a drawn ‹ day › stepper
 *   share(text)                     the system share sheet (UIActivityViewController, ACTION_SEND, NSSharingServicePicker,
 *                                   navigator.share), or the clipboard where there is none (GTK, GPUI)
 *   daysUntil(date)                 the platform's calendar (Calendar, java.time, Date)
 */
import { type Int, css, div, h2, native, p, render, small, span, update } from "../../src/index.ts";

interface WebViewProps {
  url: string;
  /** The page's title, once it has loaded. */
  onLoad: (title: string) => void;
}

interface DatePickerProps {
  /** YYYY-MM-DD. */
  value: string;
  onChange: (value: string) => void;
}

const WebView = native<WebViewProps>("WebView");
const DatePicker = native<DatePickerProps>("DatePicker");

/** Shares `text` the platform's way (its share sheet, or the clipboard where there is none) and says what happened. */
declare function share(text: string): Promise<string>;
/** Days from today to a YYYY-MM-DD date in the device's calendar (negative when it has passed). */
declare function daysUntil(date: string): Int;

const pages = ["https://example.com", "https://en.wikipedia.org/wiki/Special:Random", "https://news.ycombinator.com"];
let page = pages[0]!;
let title = "";
let day = "2026-12-24";
let shared = "";

const card = css({ p: 16, gap: 12, bg: "#ffffff", rounded: 16, border: "1px solid #e2e8f0" });
const muted = css({ color: "#64748b", text: 13 });
const chip = css({ px: 12, py: 6, rounded: 999, bg: "#eef2ff", color: "#4338ca", text: 13, weight: 600, pressed: { opacity: 0.6 } });

async function shareDay() {
  const n = daysUntil(day);
  shared = await share(`${n} days until ${day}`);
  update();
}

const App = () =>
  div(
    { style: { p: 16, gap: 16, bg: "#f1f5f9", maxWidth: 720, width: "100%", alignSelf: "center" } },
    div(
      card,
      h2("Web view"),
      div(
        { style: { row: true, gap: 8, flexWrap: "wrap" } },
        span("example.com", chip, { onClick: () => { page = pages[0]!; update(); } }),
        span("Random article", chip, { onClick: () => { page = pages[1]!; update(); } }),
        span("Hacker News", chip, { onClick: () => { page = pages[2]!; update(); } }),
      ),
      WebView({
        url: () => page,
        onLoad: (t) => {
          title = t;
          update();
        },
        style: { height: 360, rounded: 12, overflow: "hidden", border: "1px solid #e2e8f0" },
      }),
      small(() => (title === "" ? "Loading…" : `Loaded: ${title}`), muted),
    ),
    div(
      card,
      h2("Date picker"),
      div(
        { style: { row: true, items: "center", justify: "space-between", gap: 12 } },
        span("Countdown to", { style: { weight: 600 } }),
        DatePicker({
          value: () => day,
          onChange: (value) => {
            day = value;
            shared = "";
            update();
          },
          style: { height: 40, width: 150 },
        }),
      ),
      p(() => {
        const n = daysUntil(day);
        return n === 0 ? "That's today." : n > 0 ? `${n} day${n === 1 ? "" : "s"} to go.` : `${-n} day${n === -1 ? "" : "s"} ago.`;
      }, { style: { text: 28, weight: "bold", color: "#0f172a" } }),
      div(
        { style: { row: true, items: "center", gap: 12 } },
        span("Share…", chip, { onClick: () => shareDay() }),
        small(() => shared, muted),
      ),
    ),
  );

render(App);
