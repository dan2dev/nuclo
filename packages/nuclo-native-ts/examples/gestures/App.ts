/**
 * Gestures, recognized by each platform and handled the nuclo way: a handler changes plain state and
 * calls update(); the bindings move the views. A release animates with a transition.
 *
 *   Drag     onPan moves a card with the finger; letting go springs it back
 *   Swipe    list rows follow a horizontal pan and are archived past a threshold
 *   Pinch    onPinch scales a tile, onDoubleClick resets it, onLongPress changes its colour
 *   Pointer  onPointerDown / Move / Up report where the pointer is
 */
import { type Style, css, div, h2, list, p, render, scope, setTimeout, small, span, update } from "../../src/index.ts";

interface Mail {
  id: number;
  from: string;
  subject: string;
  x: number;
  swiping: boolean;
  leaving: boolean;
}

// Drag
let cardX = 0;
let cardY = 0;
let dragging = false;
let drops = 0;

// Swipe
let nextMail = 5;
let mails: Mail[] = [
  { id: 1, from: "Ada", subject: "The engine prints its own tables", x: 0, swiping: false, leaving: false },
  { id: 2, from: "Grace", subject: "Found the moth, taped it in the log", x: 0, swiping: false, leaving: false },
  { id: 3, from: "Linus", subject: "Just a hobby, won't be big", x: 0, swiping: false, leaving: false },
  { id: 4, from: "Margaret", subject: "Priority displays saved the landing", x: 0, swiping: false, leaving: false },
];
let archived = 0;

// Pinch
let zoom = 1;
let zoomStart = 1;
let warm = false;

// Pointer
let pointerX = 0;
let pointerY = 0;
let pointerDown = false;

const page: Style = { padding: 20, gap: 16, backgroundColor: "#f1f5f9" };
const card = css({ padding: 16, gap: 12, backgroundColor: "#ffffff", borderRadius: 16, shadowRadius: 12, shadowOffsetY: 4, shadowColor: "#0f172a1f" });
const muted = css({ color: "#64748b", fontSize: 13 });
const stage = css({ height: 180, borderRadius: 12, backgroundColor: "#e2e8f0", alignItems: "center", justifyContent: "center", overflow: "hidden" });

const DragCard = () =>
  div(
    card,
    scope("drag"),
    h2("Drag"),
    div(
      stage,
      div(
        {
          style: () => ({
            width: 150,
            height: 96,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: dragging ? "#4338ca" : "#6366f1",
            shadowRadius: dragging ? 28 : 10,
            shadowOffsetY: dragging ? 14 : 4,
            shadowColor: "#4338ca66",
            translateX: cardX,
            translateY: cardY,
            rotate: cardX / 14,
            scale: dragging ? 1.08 : 1,
            // While the finger is down the card follows it exactly; released, it springs home.
            transitionDuration: dragging ? 0 : 480,
            transitionEasing: "spring",
          }),
          onPan: (e) => {
            dragging = e.state === "start" || e.state === "move";
            if (dragging) {
              cardX = e.translationX;
              cardY = e.translationY;
            } else {
              cardX = 0;
              cardY = 0;
              drops++;
            }
            update("drag");
          },
        },
        span("Drag me", { style: { color: "#ffffff", fontWeight: "bold" } }),
      ),
    ),
    small(() => `x ${Math.round(cardX)}  y ${Math.round(cardY)}  ·  released ${drops} times`, muted),
  );

function archive(mail: Mail, direction: number) {
  mail.leaving = true;
  mail.swiping = false;
  mail.x = direction * 420;
  update("mail");
  // The row leaves the list once its exit has played.
  setTimeout(() => {
    mails = mails.filter((m) => m !== mail);
    archived++;
    update("mail");
  }, 220);
}

const MailRow = (mail: Mail) =>
  div(
    { style: { borderRadius: 12, backgroundColor: "#dcfce7", overflow: "hidden" } },
    div({ style: { position: "absolute", top: 0, bottom: 0, left: 16, justifyContent: "center" } }, span("Archive", { style: { color: "#15803d", fontWeight: "bold" } })),
    div(
      {
        style: () => ({
          padding: 14,
          gap: 2,
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#e2e8f0",
          borderRadius: 12,
          translateX: mail.x,
          opacity: mail.leaving ? 0 : 1,
          transitionDuration: mail.swiping ? 0 : 220,
          transitionEasing: "ease-out",
        }),
        onPan: (e) => {
          if (mail.leaving) return;
          if (e.state === "start" || e.state === "move") {
            mail.swiping = true;
            mail.x = e.translationX;
            update("mail");
          } else if (Math.abs(mail.x) > 110 || Math.abs(e.velocityX) > 900) {
            archive(mail, mail.x < 0 ? -1 : 1);
          } else {
            mail.swiping = false;
            mail.x = 0;
            update("mail");
          }
        },
      },
      span(mail.from, { style: { fontWeight: "bold", color: "#0f172a" } }),
      span(mail.subject, muted, { style: { numberOfLines: 1 } }),
    ),
  );

const SwipeList = () =>
  div(
    card,
    scope("mail"),
    h2("Swipe"),
    div({ style: { gap: 8 } }, list(() => mails, (mail) => MailRow(mail))),
    div(
      { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" } },
      small(() => `${mails.length} in the inbox, ${archived} archived`, muted),
      span("New mail", {
        style: { color: "#4f46e5", fontWeight: "bold", padding: 6, pressed: { opacity: 0.5 } },
        onClick: () => {
          nextMail++;
          mails.push({ id: nextMail, from: "Barbara", subject: `Abstraction number ${nextMail}`, x: 0, swiping: false, leaving: false });
          update("mail");
        },
      }),
    ),
  );

const PinchTile = () =>
  div(
    card,
    scope("pinch"),
    h2("Pinch, double tap, long press"),
    div(
      stage,
      {
        onPinch: (e) => {
          if (e.state === "start") zoomStart = zoom;
          zoom = Math.max(0.5, Math.min(3, zoomStart * e.scale));
          update("pinch");
        },
        onDoubleClick: () => {
          zoom = zoom > 1.01 ? 1 : 2;
          update("pinch");
        },
        onLongPress: () => {
          warm = !warm;
          update("pinch");
        },
      },
      div(
        {
          style: () => ({
            width: 90,
            height: 90,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: warm ? "#f97316" : "#0ea5e9",
            scale: zoom,
            transitionDuration: 160,
            transitionEasing: "ease-out",
          }),
        },
        span(() => `${zoom.toFixed(2)}×`, { style: { color: "#ffffff", fontWeight: "bold" } }),
      ),
    ),
    small("Two fingers (or ctrl + wheel) scale it. Double tap toggles 2×. Hold to change the colour.", muted),
  );

const PointerPad = () =>
  div(
    card,
    scope("pointer"),
    h2("Pointer"),
    div(
      {
        style: { height: 140, borderRadius: 12, backgroundColor: "#0f172a", overflow: "hidden" },
        onPointerDown: (e) => {
          pointerDown = true;
          pointerX = e.x;
          pointerY = e.y;
          update("pointer");
        },
        onPointerMove: (e) => {
          pointerX = e.x;
          pointerY = e.y;
          update("pointer");
        },
        onPointerUp: () => {
          pointerDown = false;
          update("pointer");
        },
        onPointerCancel: () => {
          pointerDown = false;
          update("pointer");
        },
      },
      div({
        style: () => ({
          position: "absolute",
          left: pointerX - 14,
          top: pointerY - 14,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#38bdf8",
          opacity: pointerDown ? 1 : 0.35,
          scale: pointerDown ? 1.5 : 1,
        }),
      }),
    ),
    small(() => `${pointerDown ? "down" : "up"} at ${Math.round(pointerX)}, ${Math.round(pointerY)}`, muted),
  );

const App = () => div({ style: page }, DragCard(), SwipeList(), PinchTile(), PointerPad(), p("Every handler above is a plain function that changes a variable and calls update().", muted));

render(App);
