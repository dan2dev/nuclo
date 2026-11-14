// Battery monitor: the battery the host reports (nuclo-native/device), live.
import "nuclo-native";
import { type Battery, battery } from "nuclo-native/device";
import { createRouter } from "nuclo-native/router";
import { action, body, card, color, heading, muted, row } from "../ui";

interface Reading {
  at: number;
  level: number;
  state: Battery["state"];
}

/** Every distinct reading since the app started, oldest first. */
const readings: Reading[] = [];
let now: Battery | null = null;

function record(next: Battery | null) {
  now = next;
  if (next?.level == null) return;
  const last = readings[readings.length - 1];
  if (last && last.level === next.level && last.state === next.state) return;
  readings.push({ at: Date.now(), level: next.level, state: next.state });
}

record(
  battery((next) => {
    record(next);
    update();
  }),
);

const percent = (level: number) => `${Math.round(level * 100)}%`;
const duration = (minutes: number) =>
  minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
const clock = (at: number) => {
  const d = new Date(at);
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
};
const tint = (level: number, state: Battery["state"]) =>
  state === "charging" || state === "full" ? color.good : level > 0.5 ? color.good : level > 0.2 ? "#f59e0b" : color.bad;

const status = (b: Battery) =>
  ({ charging: "Charging", discharging: "On battery", full: "Fully charged", unknown: "Plugged in" })[b.state];

function detail(b: Battery) {
  if (b.state === "charging") return b.minutes != null ? `${duration(b.minutes)} until full` : "Charging";
  if (b.state === "discharging") return b.minutes != null ? `${duration(b.minutes)} left` : "Estimating time left…";
  return b.state === "full" ? "Connected to power" : "";
}

// The battery drawn with views: a track, a fill as wide as the charge, a terminal nub.
const TRACK = 196;
const gauge = () =>
  div(
    { style: { flexDirection: "row", alignItems: "center", gap: 4 } },
    div(
      { style: { backgroundColor: "#d1d5db", borderRadius: 18, padding: 6 } },
      div(
        { style: { backgroundColor: color.card, borderRadius: 13, width: TRACK, height: 72, flexDirection: "row" } },
        div({
          style: () => ({
            width: Math.max(8, Math.round((now?.level ?? 0) * TRACK)),
            height: 72,
            borderRadius: 13,
            backgroundColor: now?.level != null ? tint(now.level, now.state) : color.field,
          }),
        }),
      ),
    ),
    div({ style: { width: 8, height: 30, borderRadius: 4, backgroundColor: "#d1d5db" } }),
  );

const stat = (label: string, value: () => string) =>
  div(
    { style: { backgroundColor: color.card, borderRadius: 14, padding: 12, gap: 4, flex: 1 } },
    muted(label, 12),
    heading(value, 16),
  );

const CHART = 90;
const bar = (reading: Reading) =>
  div(
    { style: { flex: 1, alignItems: "center", gap: 4 } },
    div({
      style: {
        width: 10,
        height: Math.max(4, Math.round(reading.level * CHART)),
        borderRadius: 5,
        backgroundColor: tint(reading.level, reading.state),
      },
    }),
  );

const Monitor = () =>
  div(
    { style: { padding: 16, gap: 14 } },
    when(
      () => now !== null,
      card(
        div({ style: { alignItems: "center", gap: 12, padding: 8 } }, gauge(), heading(() => (now?.level != null ? percent(now.level) : "—"), 44)),
        div(
          { style: { alignItems: "center", gap: 2 } },
          body(() => (now ? status(now) : "")),
          muted(() => (now ? detail(now) : "")),
        ),
      ),
      div(
        { style: row },
        stat("Level", () => (now?.level != null ? percent(now.level) : "—")),
        stat("Status", () => (now ? status(now) : "—")),
        stat("Time", () => (now?.minutes != null ? duration(now.minutes) : "—")),
      ),
      card(
        div({ style: row }, div({ style: { flex: 1 } }, heading("History")), muted(() => `${readings.length} ${readings.length === 1 ? "reading" : "readings"}`)),
        when(
          () => readings.length > 1,
          div(
            { style: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: CHART } },
            list(() => readings.slice(-30), bar),
          ),
        ).else(muted("The chart fills in as the level changes.")),
        action("See all readings", () => router.go("/readings")),
      ),
    ).else(
      card(
        heading("No battery"),
        body("This device does not report a battery, or runs on mains power."),
        muted("Run it on a laptop or a phone to see the level, the status and the time left."),
      ),
    ),
  );

const Readings = () =>
  div(
    { style: { padding: 16, gap: 10 } },
    when(
      () => readings.length > 0,
      card(
        list(
          () => [...readings].reverse(),
          (reading) =>
            div(
              { style: row },
              div({ style: { width: 10, height: 10, borderRadius: 5, backgroundColor: tint(reading.level, reading.state) } }),
              body(clock(reading.at)),
              div({ style: { flex: 1 } }),
              muted(reading.state),
              heading(percent(reading.level), 15),
            ),
        ),
      ),
    ).else(muted("No readings yet.")),
  );

export const router = createRouter({
  "/": { view: Monitor, title: "Battery" },
  "/readings": { view: Readings, title: "Readings" },
});

document.body.style.backgroundColor = color.page;
render(router.outlet, document.body);
