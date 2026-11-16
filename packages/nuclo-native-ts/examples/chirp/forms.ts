// Chirp's forms: a new post, the signed-in user's profile and the network the fake server answers on.
// Each keeps its draft here, checks it as it is typed, and sends it once: a second tap while the request is out
// does nothing, and a reply that comes after the user left the screen changes the data but not where they are.
import { type Modifier, type Node, type Timer, clearTimeout, div, img, input, list, setTimeout, span, textarea, update, when } from "../../src/index.ts";
import { apiCreatePost, apiHandleFree, apiSaveProfile, network } from "./api.ts";
import { router } from "./App.ts";
import { type Draft, ME, type Profile, handleShaped, photos, tints, topics, user } from "./data.ts";
import { feed, reloadMine } from "./views.ts";
import { action, band, chip, css, field, muted, mutedFn, name } from "./ui.ts";

const section = css({ p: 16, gap: 10 });
const problem = (text: () => string): Modifier => when(() => text().length > 0, span(text, { style: { color: "bad", fontSize: 13 } }));
/** Leaves the form's screen, if the user is still on it. */
function leave(path: string) {
  if (router.path === path) router.back();
}

// ── New post: /compose ─────────────────────────────────────────────────────

const LIMIT = 280;
const blank = (): Draft => ({ text: "", photo: "", topic: "" });
let draft: Draft = blank();
let posting = false;
let postFailed = false;

const length = () => draft.text.trim().length;

async function publish(): Promise<void> {
  const text = draft.text.trim();
  if (text.length === 0 || text.length > LIMIT || posting) return;
  posting = true;
  postFailed = false;
  update();
  try {
    const id = await apiCreatePost({ text, photo: draft.photo, topic: draft.topic });
    // The feed may have loaded it already, if its first page was asked for while this was out.
    if (!feed.ids.includes(id)) feed.ids.unshift(id);
    reloadMine();
    draft = blank();
    leave("/compose");
  } catch (e) {
    postFailed = true;
  }
  posting = false;
  update();
}

export const Compose = (): Node =>
  div(
    div(
      band,
      section,
      textarea(field, {
        placeholder: "What's happening?",
        ariaLabel: "Post text",
        value: () => draft.text,
        style: { minHeight: 96 },
        onInput: (e) => {
          draft.text = e.target.value;
          update();
        },
      }),
      div(
        { style: { row: true, justify: "space-between" } },
        problem(() => (length() > LIMIT ? "That's too long to post." : "")),
        span(() => `${length()} / ${LIMIT}`, { style: () => ({ color: length() > LIMIT ? "bad" : "muted", fontSize: 13 }) }),
      ),
    ),
    div(
      band,
      section,
      name("Add a photo", 14),
      div(
        { style: { row: true, gap: 8 } },
        list(
          () => photos,
          (src) =>
            img({
              src,
              style: () => ({ flex: 1, height: 56, borderRadius: 10, border: draft.photo === src ? "3px solid accent" : "3px solid card" }),
              onClick: () => {
                draft.photo = draft.photo === src ? "" : src;
                update();
              },
            }),
        ),
      ),
    ),
    div(
      band,
      section,
      name("Topic", 14),
      div(
        { style: { row: true, flexWrap: "wrap", gap: 8 } },
        list(
          () => topics,
          (t) =>
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
      section,
      action(() => (posting ? "Posting…" : "Post"), () => publish(), () => length() > 0 && length() <= LIMIT && !posting),
      problem(() => (postFailed ? "Couldn't post. Check the network (Profile → Settings) and try again." : "")),
    ),
  );

// ── Edit profile: /me/edit ─────────────────────────────────────────────────

const profile: Profile = { name: "", handle: "", bio: "", location: "", tint: "" };
let handle: "free" | "checking" | "taken" = "free";
let saving = false;
let saveFailed = false;
/** Only the answer about the handle the user ended on counts. */
let handleAsked = 0;
let handleTimer: Timer | null = null;

const nameProblem = () => (profile.name.trim().length === 0 ? "Enter a name." : profile.name.trim().length > 40 ? "40 characters at most." : "");
const handleShape = () => (handleShaped(profile.handle) ? "" : "@, then 3 to 20 letters, then up to 4 digits.");
const handleProblem = () => (handleShape().length > 0 ? handleShape() : handle === "taken" ? "That handle is taken." : "");
const bioProblem = () => (profile.bio.length > 160 ? "160 characters at most." : "");
const valid = () => nameProblem().length === 0 && handleProblem().length === 0 && bioProblem().length === 0 && handle === "free";

async function checkHandle(): Promise<void> {
  if (handleShape().length > 0) return;
  handleAsked += 1;
  const asked = handleAsked;
  try {
    const free = await apiHandleFree(profile.handle);
    if (asked !== handleAsked) return;
    handle = free ? "free" : "taken";
  } catch (e) {
    if (asked !== handleAsked) return;
    handle = "taken";
  }
  update();
}

/** Asked once the user pauses. */
function checkSoon() {
  if (handleTimer !== null) clearTimeout(handleTimer);
  handleTimer = setTimeout(() => checkHandle(), 250);
}

async function save(): Promise<void> {
  if (!valid() || saving) return;
  saving = true;
  saveFailed = false;
  update();
  try {
    await apiSaveProfile({ name: profile.name.trim(), handle: profile.handle, bio: profile.bio, location: profile.location, tint: profile.tint });
    leave("/me/edit");
  } catch (e) {
    saveFailed = true;
  }
  saving = false;
  update();
}

const labelled = (label: string, get: () => string, set: (value: string) => void, problemOf: () => string): Node =>
  div(
    { style: { gap: 6 } },
    muted(label),
    input(field, {
      value: get,
      onInput: (e) => {
        set(e.target.value);
        update();
      },
    }),
    problem(problemOf),
  );

export const EditProfile = (): Node => {
  const me = user(ME);
  profile.name = me.name;
  profile.handle = me.handle;
  profile.bio = me.bio;
  profile.location = me.location;
  profile.tint = me.tint;
  handle = "free";
  return div(
    div(
      band,
      section,
      labelled("Name", () => profile.name, (v) => (profile.name = v), nameProblem),
      labelled(
        "Handle",
        () => profile.handle,
        (v) => {
          profile.handle = v.toLowerCase();
          // Until the server says so, a changed handle is not known to be free.
          handle = "checking";
          checkSoon();
        },
        handleProblem,
      ),
      mutedFn(() => (handleShape().length > 0 ? "" : handle === "checking" ? "Checking…" : handle === "free" ? "✓ Available" : ""), 12),
      labelled("Bio", () => profile.bio, (v) => (profile.bio = v), bioProblem),
      labelled("Location", () => profile.location, (v) => (profile.location = v), () => ""),
    ),
    div(
      band,
      section,
      name("Colour", 14),
      div(
        { style: { row: true, flexWrap: "wrap", gap: 10 } },
        list(
          () => tints,
          (t) =>
            div({
              style: () => ({ size: 32, rounded: 16, backgroundColor: t, border: profile.tint === t ? "3px solid text" : "3px solid card" }),
              onClick: () => {
                profile.tint = t;
                update();
              },
            }),
        ),
      ),
    ),
    div(
      section,
      action(() => (saving ? "Saving…" : "Save"), () => save(), () => valid() && !saving),
      problem(() => (saveFailed ? "Couldn't save. Try again." : "")),
    ),
  );
};

// ── Settings: /me/settings ─────────────────────────────────────────────────

interface Speed {
  label: string;
  ms: number;
}
const speeds: Speed[] = [{ label: "Instant", ms: 0 }, { label: "Fast", ms: 250 }, { label: "Slow", ms: 1500 }];

export const Settings = (): Node =>
  div(
    div(
      band,
      section,
      name("Network", 16),
      muted("How the fake server answers. Slow replies arrive out of order; the app is built to cope."),
      div(
        { style: { row: true, gap: 8 } },
        list(
          () => speeds,
          (speed) =>
            chip(speed.label, () => network.latency === speed.ms, () => {
              network.latency = speed.ms;
              update();
            }),
        ),
      ),
      div(
        { style: { row: true, gap: 10, items: "center" } },
        input({
          type: "checkbox",
          checked: () => network.failing,
          onChange: (e) => {
            network.failing = e.target.checked;
            update();
          },
        }),
        span("Fail every third request", { style: { color: "text", fontSize: 15 } }),
      ),
    ),
  );
