// app.ts: the sequencer. The audio engine owns the clock; the UI never times a
// note. The pattern is a plain 2D array of booleans: a cell flips its entry,
// and the engine reads the same array as it books each step, so a click while
// playing is heard on the next pass. While playing, a rAF loop asks the engine
// which step is audible and updates the grid only when the answer changes.
// No audio exists until the first Play, and the mount cleanup closes it:
// leaving the example stops the sound. The song itself is kept.
import "nuclo";
import { createEngine, STEPS, TRACKS, type Engine, type Song } from "./audio.ts";
import { s } from "./styles.ts";

const hits = (line: string) => [...line].map((c) => c === "x");

// One line per track, in TRACKS order: x is a hit.
const PRESETS: Record<string, string[]> = {
  "Four on the floor": ["x...x...x...x...", "................", "....x.......x...", "x...x...x...x...", "..x...x...x...x.", "..x...x...x...x.", "x..x..x...x..x.."],
  Breakbeat: ["x.x.......xx....", "....x..x.x..x..x", "................", "x.x.x.x.x...x.x.", "..........x.....", "x.x.......x.....", "......x.......x."],
  "Hip hop": ["x.......x.x.....", "....x.......x...", "....x.......x...", "x.x.x.x.x.x.x.x.", "................", "x.......x.x.....", "..x.....x.....x."],
};
const DENSITY = [0.3, 0.15, 0.1, 0.5, 0.1, 0.3, 0.2]; // Randomize: the chance of a hit on each step, per track

const song: Song = {
  bpm: 112,
  swing: 0,
  pattern: PRESETS["Four on the floor"].map(hits),
  mix: TRACKS.map(() => ({ volume: 0.8, muted: false })),
};

// Built on the first Play, never here: the server imports this module too, and
// browsers only let an AudioContext start after a click.
let engine: Engine | null = null;
let playhead = -1; // the audible step, as last read from the engine
let frame = 0;

const playing = () => engine?.playing ?? false;

function play() {
  engine ??= createEngine(song);
  engine.play();
  frame = requestAnimationFrame(follow);
  update();
}

function stop() {
  engine?.stop();
  cancelAnimationFrame(frame);
  playhead = -1;
  update();
}

const toggle = () => (playing() ? stop() : play());

// Every frame while playing. The step changes 4 to 12 times a second, so most frames touch nothing.
function follow() {
  const now = engine!.step;
  if (now !== playhead) {
    playhead = now;
    update("seq-grid");
  }
  frame = requestAnimationFrame(follow);
}

function load(pattern: boolean[][]) {
  song.pattern = pattern;
  update();
}

function Cell(track: number, step: number) {
  return button(s.cell, {
    "aria-label": `${TRACKS[track]}, step ${step + 1}`,
    "aria-pressed": () => String(song.pattern[track][step]),
    class: () => cx(s.cell, step === playhead ? s.now : null).className,
    onClick: () => { song.pattern[track][step] = !song.pattern[track][step]; update(); },
  });
}

function Track(name: string, track: number) {
  const mix = song.mix[track];
  return div(
    s.track,
    { class: () => cx(s.track, mix.muted ? s.muted : null).className },
    div(
      s.head,
      span(s.name, name),
      button(s.mute, { title: `Mute ${name}`, "aria-pressed": () => String(mix.muted), onClick: () => { mix.muted = !mix.muted; update(); } }, "M"),
      input(s.volume, { type: "range", min: "0", max: "1", step: "0.05", value: String(mix.volume), "aria-label": `${name} volume` }, { onInput: (e) => { mix.volume = Number(e.currentTarget.value); } }),
    ),
    // Four beats of four steps: the gap between groups is the beat.
    ...[0, 4, 8, 12].map((beat) => div(s.beat, ...[0, 1, 2, 3].map((i) => Cell(track, beat + i)))),
  );
}

export function StepSequencer() {
  return div(
    s.app,
    on("mount", () => {
      // Capture: Space is handled before the modal's own document listener sees it.
      // A focused control is left alone, since a button already answers Space with a click.
      const onKey = (e: KeyboardEvent) => {
        if (e.key !== " " || (e.target as Element).closest("button, input, select, textarea")) return;
        e.preventDefault();
        toggle();
      };
      document.addEventListener("keydown", onKey, { capture: true });
      return () => {
        document.removeEventListener("keydown", onKey, { capture: true });
        cancelAnimationFrame(frame);
        engine?.dispose(); // closes the AudioContext: nothing keeps playing
        engine = null;
        playhead = -1;
      };
    }),
    div(
      s.bar,
      button(s.btn, s.primary, { title: "Shortcut: Space" }, () => (playing() ? "■ Stop" : "▶ Play"), { onClick: toggle }),
      label(s.field, "BPM", input({ type: "range", min: "60", max: "180", value: String(song.bpm) }, { onInput: (e) => { song.bpm = Number(e.currentTarget.value); update(); } }), span(s.readout, () => String(song.bpm))),
      label(s.field, "Swing", input({ type: "range", min: "0", max: "0.5", step: "0.05", value: String(song.swing) }, { onInput: (e) => { song.swing = Number(e.currentTarget.value); update(); } }), span(s.readout, () => `${Math.round(song.swing * 100)}%`)),
    ),
    div(
      s.bar,
      ...Object.entries(PRESETS).map(([name, lines]) => button(s.btn, name, { onClick: () => load(lines.map(hits)) })),
      button(s.btn, "Randomize", { onClick: () => load(DENSITY.map((d) => Array.from({ length: STEPS }, () => Math.random() < d))) }),
      button(s.btn, "Clear", { onClick: () => load(TRACKS.map(() => Array(STEPS).fill(false))) }),
    ),
    // scope("seq-grid"): the rAF loop calls update("seq-grid"), which runs the
    // bindings in here and skips the toolbars above.
    div(s.grid, scope("seq-grid"), ...TRACKS.map(Track)),
    p(s.hint, "Space plays and stops. Flip cells while it plays: the engine reads the same array, so you hear the change on the next pass."),
  );
}
