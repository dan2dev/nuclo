// app.ts: the chat. Async is plain async/await: change the state, update(),
// await, change it again, update(). History loads upward forever: a sentinel
// above the oldest message asks for the page before it, the page goes in with
// unshift(), and scrollTop grows by the height it added, so nothing on screen
// moves. Your message shows before the server has it; when send() settles,
// the same object becomes sent, or failed with a Retry, and its row stays.
// Everything a channel is lives in one plain object, so switching channels
// swaps which object the same log, head and composer read — and the sidebar
// refreshes its badges with update("chat-sidebar") while the rest sleeps.
import "nuclo";
import { CHANNELS, connect, fetchHistory, ME, send, type ChannelEvent, type ChannelInfo, type Message } from "./server.ts";
import { s } from "./styles.ts";

const GROUP = 5 * 60_000; // ms: one author's messages this close together share a header
const NEAR = 60; // px from the bottom that still counts as "at the bottom"
const EMOJIS = ["👍", "👏", "🚀", "❤️", "😂", "🎉", "💡", "🔥"];

interface Reaction {
  emoji: string;
  count: number;
  mine: boolean;
}

// A message on screen: the server's fields, how far it got, and how it joins the one above.
interface Msg extends Message {
  status: "sent" | "sending" | "failed";
  first: boolean; // starts a group: shows the avatar and the name
  day: string; // the day line above it, or ""
  fresh: boolean; // arrived live: the pop animation plays once
  edited: boolean;
  editing: boolean; // the inline editor is open
  copied: boolean;
  reactions: Reaction[];
}

interface Channel {
  info: ChannelInfo;
  messages: Msg[];
  before: number | undefined; // the id of the oldest message loaded: the next page ends there
  loading: boolean;
  error: string | null;
  atStart: boolean; // the channel has nothing older
  online: number;
  typing: Set<string>;
  unseen: number; // messages that arrived while the reader was scrolled up
  firstUnseen: Msg | null; // where the "New messages" divider sits
  unread: number; // messages that arrived while another channel was open
  draft: string;
  atBottom: boolean; // where the reader was when they left
  scrollTop: number;
}

const channels: Channel[] = CHANNELS.map((info) => ({
  info,
  messages: [],
  before: undefined,
  loading: false,
  error: null,
  atStart: false,
  online: 0,
  typing: new Set(),
  unseen: 0,
  firstUnseen: null,
  unread: 0,
  draft: "",
  atBottom: true,
  scrollTop: 0,
}));
let active = channels[0];

let scroller: HTMLElement | null = null;
let composerEl: HTMLTextAreaElement | null = null;
let composerFocused = false;
let menu = false; // the phone drawer
let picker: Msg | null = null; // the message whose reaction picker is open
let composerPicker = false;
let lookAgain = () => {}; // set by the sentinel: checks again whether it is in view

const toMsg = (m: Message, fresh = false): Msg => {
  const msg: Msg = { ...m, status: "sent", first: true, day: "", fresh, edited: false, editing: false, copied: false, reactions: [] };
  if (fresh) setTimeout(() => { msg.fresh = false; }, 1200);
  return msg;
};

const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fullTime = (t: number) => new Date(t).toLocaleString([], { dateStyle: "long", timeStyle: "medium" });
const dayOf = (t: number) => {
  const d = new Date(t);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
};
const hue = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);

// What messages[i] shows depends on the message above it: a day line when the
// day changes, the author's header when a new group starts.
function link(ch: Channel, i: number) {
  const m = ch.messages[i];
  const prev = ch.messages[i - 1];
  const day = dayOf(m.at);
  m.day = prev && dayOf(prev.at) === day ? "" : day;
  m.first = m.day !== "" || prev.author !== m.author || m.at - prev.at > GROUP;
}

function push(ch: Channel, m: Msg) {
  ch.messages.push(m);
  link(ch, ch.messages.length - 1);
}

const nearBottom = () => !scroller || scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < NEAR;
const toBottom = (behavior: ScrollBehavior = "auto") => scroller?.scrollTo({ top: scroller.scrollHeight, behavior });

async function loadOlder() {
  const ch = active;
  if (ch.loading || ch.error !== null || ch.atStart) return;
  ch.loading = true;
  update();
  try {
    const page = await fetchHistory(ch.info.id, ch.before);
    if (page.length === 0) ch.atStart = true;
    else {
      ch.before = page[0].id;
      ch.messages.unshift(...page.map((m) => toMsg(m)));
      for (let i = 0; i <= page.length && i < ch.messages.length; i++) link(ch, i); // the old top message may join the page's last group
    }
  } catch (e) {
    ch.error = (e as Error).message;
  }
  ch.loading = false;
  // The page lands above what the reader is looking at: measure, update(), and
  // scroll down by the height it added. On the first page, that is the bottom.
  // A channel left mid-flight keeps its page, but the visible log is untouched.
  const height = ch === active ? scroller?.scrollHeight ?? 0 : 0;
  update();
  if (ch === active && scroller) {
    scroller.scrollTop += scroller.scrollHeight - height;
    lookAgain(); // a short page can leave the sentinel in view: then load the next one too
  }
}

// The row of a message, for the scroll arithmetic that keeps the view stable.
const rowOf = (m: Msg) => scroller?.querySelector(`[data-msg="${m.id}"]`) as HTMLElement | null | undefined;

// A row grew or shrank (picker, editor, a reaction): keep the view stable the
// same way loadOlder() does — except a reader stuck to the bottom follows it.
function relayoutUnder(el: HTMLElement | null | undefined) {
  if (!el || !scroller) { update("chat-pane"); return; }
  const stick = nearBottom();
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
  const height = scroller.scrollHeight;
  update("chat-pane");
  if (stick) toBottom();
  else if (top + el.offsetHeight <= scroller.scrollTop) scroller.scrollTop += scroller.scrollHeight - height;
}

function receive(e: ChannelEvent) {
  const ch = channels.find((c) => c.info.id === e.channel);
  if (!ch) return;
  if (e.type === "online") {
    ch.online = e.count;
    if (ch === active) update();
    else update("chat-sidebar");
    return;
  }
  if (e.type === "typing") {
    ch.typing.add(e.author);
    if (ch === active) {
      const stick = nearBottom();
      update("chat-pane");
      if (stick) toBottom(); // the typing row appears at the bottom: stay on it
    }
    return;
  }
  if (e.type === "reaction") {
    const m = ch.messages.find((x) => x.id === e.messageId);
    if (!m) return;
    react(m, e.emoji, false);
    if (ch === active) relayoutUnder(rowOf(m));
    return;
  }
  ch.typing.delete(e.message.author);
  const m = toMsg(e.message, true);
  push(ch, m);
  if (ch === active) {
    const stick = nearBottom(); // read before anything changes
    if (!stick) {
      ch.unseen++;
      ch.firstUnseen ??= m;
    }
    update();
    if (stick) toBottom(); // a reader at the bottom follows the conversation; the others get the pill
  } else {
    ch.unread++;
    ch.firstUnseen ??= m;
    update("chat-sidebar"); // only the badge needs to know
  }
}

// Optimistic: the message is on screen before the server has it. send() only
// changes fields on the same object, so its row is never rebuilt.
async function deliver(m: Msg) {
  const ch = active;
  m.status = "sending";
  update();
  try {
    Object.assign(m, await send(ch.info.id, m.text));
    m.status = "sent";
  } catch {
    m.status = "failed";
  }
  update();
}

function submit() {
  const ch = active;
  const text = ch.draft.trim();
  if (!text) return;
  ch.draft = "";
  ch.unseen = 0;
  ch.firstUnseen = null;
  const m = toMsg({ id: -1, author: ME, text, at: Date.now() }, true);
  push(ch, m);
  deliver(m);
  toBottom(); // your own message always takes you down
}

function remove(m: Msg) {
  const ch = active;
  const i = ch.messages.indexOf(m);
  ch.messages.splice(i, 1);
  if (i < ch.messages.length) link(ch, i); // the next message may now start a group
  update();
}

const typingText = () => {
  const names = [...active.typing];
  return names.length === 0 ? "" : `${names.join(" and ")} ${names.length === 1 ? "is" : "are"} typing…`;
};

function markRead() {
  active.unseen = 0;
  active.firstUnseen = null;
  update("chat-pane");
}

// ── Reactions: a plain array on each message, rebuilt on every change ──

function react(m: Msg, emoji: string, mine: boolean) {
  const r = m.reactions.find((x) => x.emoji === emoji);
  if (!r) m.reactions = [...m.reactions, { emoji, count: 1, mine }];
  else if (r.mine) {
    if (mine) return;
    m.reactions = r.count === 1 ? m.reactions.filter((x) => x !== r) : m.reactions.map((x) => (x === r ? { emoji, count: x.count - 1, mine: false } : x));
  } else if (mine) m.reactions = m.reactions.map((x) => (x === r ? { emoji, count: x.count + 1, mine: true } : x));
  else m.reactions = m.reactions.map((x) => (x === r ? { emoji, count: x.count + 1, mine: false } : x));
}

function toggleReaction(m: Msg, emoji: string) {
  react(m, emoji, true);
  picker = null;
  relayoutUnder(rowOf(m));
}

// ── The composer: a scope, so a keystroke only refreshes the composer ──

function insertEmoji(emoji: string) {
  active.draft += emoji;
  composerPicker = false;
  update("chat-composer");
  composerEl?.focus();
}

const lastOwn = () => [...active.messages].reverse().find((m) => m.author === ME && m.status === "sent");

// ── Editing: swap the text for a textarea on the same row, patch on save ──

function startEdit(m: Msg) {
  m.editing = true;
  relayoutUnder(rowOf(m));
}

function cancelEdit(m: Msg) {
  m.editing = false;
  relayoutUnder(rowOf(m));
  composerEl?.focus();
}

function saveEdit(m: Msg, value: string) {
  const text = value.trim();
  if (text && text !== m.text) {
    m.text = text;
    m.edited = true;
  }
  m.editing = false;
  relayoutUnder(rowOf(m));
  composerEl?.focus();
}

async function copy(m: Msg) {
  try {
    await navigator.clipboard.writeText(m.text);
  } catch {
    // The Clipboard API can be missing in sandboxed frames: fall back to a selection.
    const ta = document.createElement("textarea");
    ta.value = m.text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  m.copied = true;
  update("chat-pane");
  setTimeout(() => { m.copied = false; update("chat-pane"); }, 1200);
}

// ── Markdown-lite: bold, italic, inline code, links and @mentions. The text
// is parsed once per message, and the segments are a nested list(), so an edit
// replaces them without touching the row.

type Seg =
  | { k: "text"; text: string }
  | { k: "bold"; text: string }
  | { k: "ital"; text: string }
  | { k: "code"; text: string }
  | { k: "link"; text: string; href: string }
  | { k: "mention"; text: string; me: boolean };

const TOKEN = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)|(@[a-z-]+)|(https?:\/\/\S+)/gi;

function parseSegments(text: string): Seg[] {
  const out: Seg[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const i = match.index ?? 0;
    if (i > last) out.push({ k: "text", text: text.slice(last, i) });
    const [full, code, bold, ital, mention, link] = match;
    if (code) out.push({ k: "code", text: code.slice(1, -1) });
    else if (bold) out.push({ k: "bold", text: bold.slice(2, -2) });
    else if (ital) out.push({ k: "ital", text: ital.slice(1, -1) });
    else if (mention) out.push({ k: "mention", text: full, me: full === "@you" });
    else if (link) {
      const href = link.replace(/[.,;:!?]+$/, "");
      out.push({ k: "link", text: href, href });
    }
    last = i + full.length;
  }
  if (last < text.length) out.push({ k: "text", text: text.slice(last) });
  return out;
}

const segCache = new WeakMap<Msg, { text: string; segs: Seg[] }>();
function segs(m: Msg): Seg[] {
  const hit = segCache.get(m);
  if (hit && hit.text === m.text) return hit.segs;
  const next = { text: m.text, segs: parseSegments(m.text) };
  segCache.set(m, next);
  return next.segs;
}

function SegView(g: Seg) {
  if (g.k === "code") return span(s.code, g.text);
  if (g.k === "bold") return span({ style: { fontWeight: "700" } }, g.text);
  if (g.k === "ital") return span({ style: { fontStyle: "italic" } }, g.text);
  if (g.k === "link") return a({ href: g.href, target: "_blank", rel: "noopener" }, s.link, g.text);
  if (g.k === "mention") return span(g.me ? s.mentionMe : s.mention, g.text);
  return span(g.text);
}

// ── The pieces ──

function ReactionChip(m: Msg, r: Reaction) {
  return button(
    {
      type: "button",
      class: () => cx(s.reaction, r.mine ? s.reactionMine : null).className,
      title: () => `${r.emoji} — ${r.count}`,
      "aria-label": `${r.emoji}: ${r.count} reaction${r.count === 1 ? "" : "s"}${r.mine ? ", yours" : ""}`,
      onClick: () => {
        react(m, r.emoji, !r.mine); // yours leaves, theirs joins
        relayoutUnder(rowOf(m));
      },
    },
    span(r.emoji),
    span(s.reactionCount, () => String(r.count)),
  );
}

function MessageRow(m: Msg) {
  return article(
    s.msg,
    {
      "data-msg": () => String(m.id), // reactive: the optimistic -1 becomes the server id when send() settles
      class: () => cx(s.msg, m.first ? s.first : null, m.status === "sent" ? null : m.status === "sending" ? s.sending : s.failed, m.fresh ? s.live : null, m.text.includes("@you") ? s.mentionRow : null).className,
    },
    when(() => m.day !== "", div(s.day, () => m.day)),
    when(() => active.firstUnseen === m, div(s.divider, span("New messages"), button(s.dividerBtn, { type: "button", onClick: markRead }, "Mark as read"))),
    when(
      () => m.first,
      div(s.avatar, { style: { backgroundColor: `hsl(${hue(m.author)} 55% 48%)` }, title: m.author }, m.author[0].toUpperCase()),
      div(s.meta, strong(m.author), time({ title: fullTime(m.at) }, clock(m.at)), when(() => m.edited, span(s.edited, "(edited)"))),
    ),
    when(
      () => m.editing,
      textarea(s.edit, { "aria-label": "Edit message", value: m.text }, {
        onKeyDown: (e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); saveEdit(m, e.currentTarget.value); }
          else if (e.key === "Escape") cancelEdit(m);
        },
      }, on("mount", (el) => { el.focus(); el.setSelectionRange(el.value.length, el.value.length); })),
    ),
    when(() => !m.editing, p(s.text, list(() => segs(m), SegView))),
    when(() => m.reactions.length > 0, div(s.reactions, list(() => m.reactions, (r) => ReactionChip(m, r)))),
    when(
      () => picker === m,
      div(s.picker, ...EMOJIS.map((emoji) => button(s.pick, { type: "button", title: emoji, "aria-label": `React with ${emoji}`, onClick: () => toggleReaction(m, emoji) }, emoji))),
    ),
    when(
      () => m.status === "sent" && !m.editing,
      div(s.actions, { "data-chat-actions": "" },
        button(s.action, { type: "button", title: "Add a reaction", "aria-label": "Add a reaction", onClick: () => { picker = picker === m ? null : m; relayoutUnder(rowOf(m)); } }, "😊"),
        button(s.action, { type: "button", "aria-label": "Copy message", onClick: () => copy(m) }, () => (m.copied ? "✓ Copied" : "Copy")),
        when(
          () => m.author === ME,
          button(s.action, { type: "button", "aria-label": "Edit message", onClick: () => startEdit(m) }, "Edit"),
          button(s.action, { type: "button", "aria-label": "Delete message", onClick: () => remove(m) }, "Delete"),
        ),
      ),
    ),
    when(
      () => m.status === "failed",
      div(s.retry, "Not sent.", button(s.small, { type: "button", onClick: () => deliver(m) }, "Retry"), button(s.small, { type: "button", onClick: () => remove(m) }, "Delete")),
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
    when(() => active.error !== null, div(s.error, span(() => active.error ?? ""), button(s.btn, { type: "button", onClick: () => { active.error = null; loadOlder(); } }, "Retry")))
      .when(() => active.atStart, p(s.beginning, () => `This is the beginning of ${active.info.name}.`))
      .else(p(s.loading, "Loading older messages…")),
  );
}

// A channel row: the badge is the only thing an inactive channel updates.
function Sidebar() {
  return nav(
    s.sidebar,
    scope("chat-sidebar"),
    { "data-chat-sidebar": "", class: () => cx(s.sidebar, menu ? null : s.sidebarClosed).className },
    div(s.brand, div(s.logo, "◆"), "nuclo chat"),
    div(s.sideLabel, "Channels"),
    list(() => channels, (ch) =>
      button(
        {
          type: "button",
          class: () => cx(s.channel, ch === active ? s.channelOn : null).className,
          "aria-current": () => String(ch === active),
          title: ch.info.topic,
          onClick: () => openChannel(ch),
        },
        span(s.hash, "#"),
        span(s.channelName, () => ch.info.name.slice(2)),
        when(() => ch.unread > 0, span(s.badge, () => (ch.unread > 99 ? "99+" : String(ch.unread)))),
      )),
    div(s.sideFoot,
      div(s.you,
        div(s.youAvatar, "y"),
        div(s.youMeta,
          span(s.youName, "you"),
          span(s.youSub, () => `${channels.length} channels · ${channels.reduce((n, c) => n + c.online, 0)} people online`),
        ),
      ),
    ),
  );
}

// Switching channels keeps the one you leave, exactly as it was.
function openChannel(ch: Channel) {
  if (ch === active) { menu = false; update(); return; }
  active.atBottom = nearBottom();
  active.scrollTop = scroller?.scrollTop ?? 0;
  active = ch;
  menu = false;
  picker = null;
  composerPicker = false;
  const away = ch.unread; // what arrived while this channel was closed
  ch.unread = 0;
  // Clicking the channel button blurs the composer: on a pointer-fine device,
  // put the cursor back so the reader can keep typing. On touch, leave it —
  // focusing would pop the keyboard over the conversation.
  const focusComposer = composerFocused || (document.activeElement instanceof HTMLElement && document.activeElement.getAttribute("aria-current") !== null);
  const pointerFine = matchMedia("(hover: hover)").matches;
  update();
  if (scroller) {
    if (ch.atBottom) {
      toBottom();
      ch.unseen = 0;
      ch.firstUnseen = null;
    } else {
      scroller.scrollTop = ch.scrollTop;
      ch.unseen += away; // what arrived while away joins what was already unread
      if (nearBottom()) {
        ch.unseen = 0;
        ch.firstUnseen = null;
      }
    }
  }
  if (focusComposer && pointerFine) composerEl?.focus();
  lookAgain(); // the sentinel may be in view again: load the next page
}

export function ChatApp() {
  return div(
    s.app,
    on("mount", () => {
      const disconnect = connect(receive);
      loadOlder();
      return () => {
        disconnect();
        channels.forEach((ch) => { ch.typing.clear(); ch.unseen = 0; ch.firstUnseen = null; });
      };
    }),
    Sidebar(),
    when(() => menu, div(s.backdrop, { onClick: () => { menu = false; update(); } })),
    div(
      s.main,
      header(
        s.head,
        button(s.menuBtn, { type: "button", "aria-label": "Channels", "aria-expanded": () => String(menu), onClick: () => { menu = !menu; update(); } }, "☰"),
        div(s.headMain, strong(() => active.info.name), span(s.topic, () => active.info.topic)),
        span(s.online, () => (active.online ? `${active.online} online` : "connecting…")),
        span(s.state, () => `${active.messages.length} messages in the DOM · ${active.loading ? "loading history…" : active.atStart ? "all of it" : "scroll up for more"}`),
      ),
      div(
        s.pane,
        scope("chat-pane"),
        div(
          s.log,
          on("mount", (el) => {
            scroller = el;
            toBottom(); // opened again: the messages are still here, show the newest
            return () => { scroller = null; };
          }),
          { onScroll: () => { if (active.unseen > 0 && nearBottom()) { active.unseen = 0; active.firstUnseen = null; update("chat-pane"); } } },
          Sentinel(),
          list(() => active.messages, MessageRow),
          when(() => active.typing.size > 0, div(s.typingRow, { "aria-live": "polite" }, span(s.dots, i(), i(), i()), span(() => typingText()))),
        ),
        when(
          () => active.unseen > 0,
          button(s.pill, () => `${active.unseen} new message${active.unseen === 1 ? "" : "s"} ↓`, { onClick: () => { markRead(); toBottom("smooth"); } }),
        ),
      ),
      div(
        s.composerArea,
        scope("chat-composer"), // one scope for the picker and the form: a keystroke or an emoji click refreshes only this
        when(
          () => composerPicker,
          div(s.composerPicker, ...EMOJIS.map((emoji) => button(s.pick, { type: "button", title: emoji, "aria-label": `Add ${emoji}`, onClick: () => insertEmoji(emoji) }, emoji))),
        ),
        form(
          s.composer,
          { onSubmit: (e) => { e.preventDefault(); submit(); } },
          textarea(s.input, { rows: 1, placeholder: () => `Message ${active.info.name}`, "aria-label": "Message", value: () => active.draft }, {
            onInput: (e) => { active.draft = e.currentTarget.value; update("chat-composer"); }, // a keystroke only refreshes the composer
            onKeyDown: (e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); }
              else if (e.key === "ArrowUp" && active.draft === "" && e.currentTarget.selectionStart === 0) {
                const last = lastOwn();
                if (last) { e.preventDefault(); startEdit(last); } // ↑ edits your last message
              }
            },
            onFocus: () => { composerFocused = true; },
            onBlur: () => { composerFocused = false; },
          }, on("mount", (el) => { composerEl = el; el.focus(); })),
          button(s.emojiBtn, { type: "button", title: "Add an emoji", "aria-label": "Add an emoji", onClick: () => { composerPicker = !composerPicker; update("chat-composer"); } }, "😊"),
          button(s.send, { type: "submit", disabled: () => !active.draft.trim() }, "Send"),
        ),
      ),
    ),
  );
}
