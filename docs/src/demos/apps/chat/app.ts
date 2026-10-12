// app.ts: the chat. Async is plain async/await: change the state, update(),
// await, change it again, update(). History loads upward forever: a sentinel
// above the oldest message asks for the page before it, the page goes in with
// unshift(), and scrollTop grows by the height it added, so nothing on screen
// moves. Your message shows before the server has it; when send() settles,
// the same object becomes sent, or failed with a Retry, and its row stays.
import "nuclo";
import { connect, fetchHistory, ME, send, type ChannelEvent, type Message } from "./server.ts";
import { s } from "./styles.ts";

const GROUP = 5 * 60_000; // ms: one author's messages this close together share a header
const NEAR = 60; // px from the bottom that still counts as "at the bottom"

// A message on screen: the server's fields, how far it got, and how it joins the one above.
interface Msg extends Message {
  status: "sent" | "sending" | "failed";
  first: boolean; // starts a group: shows the avatar and the name
  day: string; // the day line above it, or ""
}

const messages: Msg[] = [];
let before: number | undefined; // the id of the oldest message loaded: the next page ends there
let loading = false;
let error: string | null = null;
let atStart = false; // the channel has nothing older
let online = 0;
const typing = new Set<string>();
let unseen = 0; // messages that arrived while the reader was scrolled up
let draft = "";
let scroller: HTMLElement | null = null;
let lookAgain = () => {}; // set by the sentinel: checks again whether it is in view

const toMsg = (m: Message): Msg => ({ ...m, status: "sent", first: true, day: "" });
const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const dayOf = (t: number) => new Date(t).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
const hue = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);

// What messages[i] shows depends on the message above it: a day line when the
// day changes, the author's header when a new group starts.
function link(i: number) {
  const m = messages[i];
  const prev = messages[i - 1];
  const day = dayOf(m.at);
  m.day = prev && dayOf(prev.at) === day ? "" : day;
  m.first = m.day !== "" || prev.author !== m.author || m.at - prev.at > GROUP;
}

function push(m: Msg) {
  messages.push(m);
  link(messages.length - 1);
}

const nearBottom = () => !scroller || scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < NEAR;
const toBottom = (behavior: ScrollBehavior = "auto") => scroller?.scrollTo({ top: scroller.scrollHeight, behavior });

async function loadOlder() {
  if (loading || error !== null || atStart) return;
  loading = true;
  update();
  try {
    const page = await fetchHistory(before);
    if (page.length === 0) atStart = true;
    else {
      before = page[0].id;
      messages.unshift(...page.map(toMsg));
      for (let i = 0; i <= page.length && i < messages.length; i++) link(i); // the old top message may join the page's last group
    }
  } catch (e) {
    error = (e as Error).message;
  }
  loading = false;
  // The page lands above what the reader is looking at: measure, update(), and
  // scroll down by the height it added. On the first page, that is the bottom.
  const height = scroller?.scrollHeight ?? 0;
  update();
  if (scroller) scroller.scrollTop += scroller.scrollHeight - height;
  lookAgain(); // a short page can leave the sentinel in view: then load the next one too
}

function receive(e: ChannelEvent) {
  const stick = nearBottom(); // read before anything changes
  if (e.type === "online") online = e.count;
  else if (e.type === "typing") typing.add(e.author);
  else {
    typing.delete(e.message.author);
    push(toMsg(e.message));
    if (!stick) unseen++;
  }
  update();
  if (stick && e.type === "message") toBottom(); // a reader at the bottom follows the conversation; the others get the pill
}

// Optimistic: the message is on screen before the server has it. send() only
// changes fields on the same object, so its row is never rebuilt.
async function deliver(m: Msg) {
  m.status = "sending";
  update();
  try {
    Object.assign(m, await send(m.text));
    m.status = "sent";
  } catch {
    m.status = "failed";
  }
  update();
}

function submit() {
  const text = draft.trim();
  if (!text) return;
  draft = "";
  unseen = 0;
  const m = toMsg({ id: -1, author: ME, text, at: Date.now() });
  push(m);
  deliver(m);
  toBottom(); // your own message always takes you down
}

function remove(m: Msg) {
  const i = messages.indexOf(m);
  messages.splice(i, 1);
  if (i < messages.length) link(i); // the next message may now start a group
  update();
}

const typingText = () => {
  const names = [...typing];
  return names.length === 0 ? "" : `${names.join(" and ")} ${names.length === 1 ? "is" : "are"} typing…`;
};

function MessageRow(m: Msg) {
  return article(
    s.msg,
    { class: () => cx(s.msg, m.first ? s.first : null, m.status === "sent" ? null : s[m.status]).className },
    when(() => m.day !== "", div(s.day, () => m.day)),
    when(
      () => m.first,
      div(s.avatar, { style: { backgroundColor: `hsl(${hue(m.author)} 55% 48%)` } }, m.author[0].toUpperCase()),
      div(s.meta, strong(m.author), time(clock(m.at))),
    ),
    p(s.text, m.text),
    when(
      () => m.status === "failed",
      div(s.retry, "Not sent.", button(s.small, "Retry", { onClick: () => deliver(m) }), button(s.small, "Delete", { onClick: () => remove(m) })),
    ),
  );
}

// The row above the oldest message: it asks for the page before it while it
// is still well out of view, and says how that went.
function Sentinel() {
  return div(
    s.top,
    on("mount", (el) => {
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) loadOlder(); },
        { root: el.parentElement, rootMargin: "800px" },
      );
      observer.observe(el);
      lookAgain = () => { observer.unobserve(el); observer.observe(el); };
      return () => { observer.disconnect(); lookAgain = () => {}; };
    }),
    when(() => error !== null, div(s.error, span(() => error ?? ""), button(s.btn, "Retry", { onClick: () => { error = null; loadOlder(); } })))
      .when(() => atStart, p(s.beginning, "This is the beginning of #general."))
      .else(p(s.loading, "Loading older messages…")),
  );
}

export function ChatApp() {
  return div(
    s.app,
    on("mount", () => {
      const disconnect = connect(receive);
      return () => { disconnect(); typing.clear(); unseen = 0; };
    }),
    header(
      s.head,
      strong("# general"),
      span(s.online, () => (online ? `${online} online` : "connecting…")),
      span(s.state, () => `${messages.length} messages in the DOM · ${loading ? "loading history…" : atStart ? "all of it" : "scroll up for more"}`),
    ),
    div(
      s.pane,
      div(
        s.log,
        on("mount", (el) => {
          scroller = el;
          toBottom(); // opened again: the messages are still here, show the newest
          return () => { scroller = null; };
        }),
        { onScroll: () => { if (unseen > 0 && nearBottom()) { unseen = 0; update(); } } },
        Sentinel(),
        list(() => messages, MessageRow),
      ),
      when(
        () => unseen > 0,
        button(s.pill, () => `${unseen} new message${unseen === 1 ? "" : "s"} ↓`, { onClick: () => { unseen = 0; update(); toBottom("smooth"); } }),
      ),
    ),
    p(s.typing, { "aria-live": "polite" }, typingText),
    form(
      s.composer,
      scope("chat-composer"),
      { onSubmit: (e) => { e.preventDefault(); submit(); } },
      textarea(s.input, { rows: 1, placeholder: "Message #general", "aria-label": "Message", value: () => draft }, {
        onInput: (e) => { draft = e.currentTarget.value; update("chat-composer"); }, // a keystroke only refreshes the composer
        onKeyDown: (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } },
      }),
      button(s.send, { type: "submit", disabled: () => !draft.trim() }, "Send"),
    ),
  );
}
