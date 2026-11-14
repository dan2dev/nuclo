// Chirp's forms: a new post, the signed-in user's profile and the network the fake server answers on.
// Each keeps its draft here, checks it as it is typed, and sends it once: a second tap while the request is out
// does nothing, and a reply that comes after the user left the screen changes the data but not where they are.
import { api, debounced, latest, network } from "./api";
import { router } from "./app";
import { type Draft, ME, type Profile, photos, tints, topics, user } from "./data";
import { feed, field, line, name, reloadMine } from "./views";
import { action, chip, color, muted, row } from "../ui";

const value = (event: Event) => (event.target as HTMLInputElement).value;
const section = (...children: NodeModLike<"div">[]) =>
  div({ style: { padding: 16, gap: 10, backgroundColor: color.card, borderBottom: `1px solid ${line}` } }, ...children);
const problem = (text: () => string) => when(() => !!text(), span(text, { style: { color: color.bad, fontSize: 13 } }));
/** Leaves the form's screen, if the user is still on it. */
const leave = (path: string) => router.path === path && router.back();

// ── New post: /compose ─────────────────────────────────────────────────────

const LIMIT = 280;
const blank = (): Draft => ({ text: "", photo: "", topic: "" });
let draft = blank();
let posting = false;
let postFailed = false;

function publish() {
  const text = draft.text.trim();
  if (!text || text.length > LIMIT || posting) return;
  posting = true;
  postFailed = false;
  update();
  api.createPost({ ...draft, text }).then(
    (id) => {
      // The feed may have loaded it already, if its first page was asked for while this was out.
      if (!feed.ids.includes(id)) feed.ids.unshift(id);
      reloadMine();
      draft = blank();
      leave("/compose");
    },
    () => (postFailed = true),
  ).then(() => {
    posting = false;
    update();
  });
}

export const Compose = () =>
  div(
    section(
      textarea({
        placeholder: "What's happening?",
        "aria-label": "Post text",
        rows: 4,
        value: () => draft.text,
        style: field,
        onInput: (e) => {
          draft.text = value(e);
          update();
        },
      }),
      div(
        { style: { flexDirection: "row", justifyContent: "space-between" } },
        problem(() => (draft.text.trim().length > LIMIT ? "That's too long to post." : "")),
        span(() => `${draft.text.trim().length} / ${LIMIT}`, {
          style: () => ({ color: draft.text.trim().length > LIMIT ? color.bad : color.muted, fontSize: 13 }),
        }),
      ),
    ),
    section(
      name("Add a photo", 14),
      div(
        { style: { flexDirection: "row", gap: 8 } },
        ...photos.map((src) =>
          img({
            src,
            style: () => ({ flex: 1, height: 56, borderRadius: 10, border: `3px solid ${draft.photo === src ? color.accent : color.card}` }),
            onClick: () => {
              draft.photo = draft.photo === src ? "" : src;
              update();
            },
          }),
        ),
      ),
    ),
    section(
      name("Topic", 14),
      div(
        { style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } },
        ...topics.map((t) =>
          div(
            { style: { width: 110 } },
            chip(`#${t}`, () => draft.topic === t, () => {
              draft.topic = draft.topic === t ? "" : t;
              update();
            }),
          ),
        ),
      ),
    ),
    div(
      { style: { padding: 16, gap: 10 } },
      action(() => (posting ? "Posting…" : "Post"), publish, () => !!draft.text.trim() && draft.text.trim().length <= LIMIT && !posting),
      problem(() => (postFailed ? "Couldn't post. Check the network (Profile → Settings) and try again." : "")),
    ),
  );

// ── Edit profile: /me/edit ─────────────────────────────────────────────────

let profile: Profile;
let handle: "free" | "checking" | "taken" = "free";
let saving = false;
let saveFailed = false;
const checked = latest();

const nameProblem = () => (profile.name.trim() ? (profile.name.trim().length > 40 ? "40 characters at most." : "") : "Enter a name.");
const handleShape = () => (/^@[a-z]{3,20}\d{0,4}$/.test(profile.handle) ? "" : "@, then 3 to 20 letters, then up to 4 digits.");
const handleProblem = () => handleShape() || (handle === "taken" ? "That handle is taken." : "");
const bioProblem = () => (profile.bio.length > 160 ? "160 characters at most." : "");
const valid = () => !nameProblem() && !handleProblem() && !bioProblem() && handle === "free";

// Asked once the user pauses, and only the answer about the handle they ended on counts.
const checkHandle = debounced(() => {
  if (handleShape()) return;
  checked(
    api.handleFree(profile.handle),
    (free) => {
      handle = free ? "free" : "taken";
      update();
    },
    () => {
      handle = "taken";
      update();
    },
  );
});

function save() {
  if (!valid() || saving) return;
  saving = true;
  saveFailed = false;
  update();
  api.saveProfile({ ...profile, name: profile.name.trim() }).then(
    () => leave("/me/edit"),
    () => (saveFailed = true),
  ).then(() => {
    saving = false;
    update();
  });
}

const labelled = (label: string, key: "name" | "handle" | "bio" | "location", problemOf: () => string, changed = () => {}) =>
  div(
    { style: { gap: 6 } },
    muted(label),
    input({
      value: () => profile[key],
      style: field,
      onInput: (e) => {
        profile[key] = value(e);
        changed();
        update();
      },
    }),
    problem(problemOf),
  );

export const EditProfile = () => {
  const { name: n, handle: h, bio, location, tint } = user(ME);
  profile = { name: n, handle: h, bio, location, tint };
  handle = "free";
  return div(
    section(
      labelled("Name", "name", nameProblem),
      labelled("Handle", "handle", handleProblem, () => {
        profile.handle = profile.handle.toLowerCase();
        // Until the server says so, a changed handle is not known to be free.
        handle = "checking";
        checkHandle();
      }),
      muted(() => (handleShape() ? "" : handle === "checking" ? "Checking…" : handle === "free" ? "✓ Available" : ""), 12),
      labelled("Bio", "bio", bioProblem),
      labelled("Location", "location", () => ""),
    ),
    section(
      name("Colour", 14),
      div(
        { style: { flexDirection: "row", flexWrap: "wrap", gap: 10 } },
        ...tints.map((t) =>
          div({
            style: () => ({ width: 32, height: 32, borderRadius: 16, backgroundColor: t, border: `3px solid ${profile.tint === t ? color.text : color.card}` }),
            onClick: () => {
              profile.tint = t;
              update();
            },
          }),
        ),
      ),
    ),
    div(
      { style: { padding: 16, gap: 10 } },
      action(() => (saving ? "Saving…" : "Save"), save, () => valid() && !saving),
      problem(() => (saveFailed ? "Couldn't save. Try again." : "")),
    ),
  );
};

// ── Settings: /me/settings ─────────────────────────────────────────────────

const speeds: [string, number][] = [["Instant", 0], ["Fast", 250], ["Slow", 1500]];

export const Settings = () =>
  div(
    section(
      name("Network", 16),
      muted("How the fake server answers. Slow replies arrive out of order; the app is built to cope."),
      div(
        { style: { flexDirection: "row", gap: 8 } },
        ...speeds.map(([label, ms]) =>
          chip(label, () => network.latency === ms, () => {
            network.latency = ms;
            update();
          }),
        ),
      ),
      div(
        { style: row },
        input({
          type: "checkbox",
          checked: () => network.failing,
          onChange: (e) => {
            network.failing = (e.target as HTMLInputElement).checked;
            update();
          },
        }),
        span("Fail every third request", { style: { color: color.text, fontSize: 15 } }),
      ),
    ),
  );
