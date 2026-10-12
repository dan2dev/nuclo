// audio.ts: a drum machine with no UI. Web Audio owns the clock: every note is
// booked ahead on the AudioContext timeline, so a busy main thread can delay
// the booking but never the beat (the "Tale of Two Clocks" scheduler). The
// engine reads the song, a plain object the UI edits too, each time it books a
// step, and it answers which step is heard right now. Every sound is
// synthesized: oscillators, one buffer of noise, filters and envelopes.

export const TRACKS = ["Kick", "Snare", "Clap", "Hat", "Open hat", "Bass", "Pluck"];
export const STEPS = 16;

export interface Song {
  bpm: number;
  swing: number; // 0 is straight; at 1/3 every second 16th lands on a triplet
  pattern: boolean[][]; // pattern[track][step]
  mix: { volume: number; muted: boolean }[]; // one per track
}

export interface Engine {
  readonly playing: boolean;
  readonly step: number; // the step heard right now, -1 when stopped
  play(): void;
  stop(): void;
  dispose(): void;
}

const LOOKAHEAD = 0.1; // s: how far ahead notes are booked
const TICK = 25; // ms between bookings: the overlap with LOOKAHEAD absorbs a late timer

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
// The tonal tracks play a fixed line, one note per step: the grid decides which notes sound.
const BASS = [45, 45, 57, 45, 48, 48, 60, 48, 43, 43, 55, 43, 50, 50, 52, 55].map(hz);
const PLUCK = [69, 72, 76, 79, 81, 79, 76, 72, 74, 76, 79, 81, 79, 76, 74, 72].map(hz);

export function createEngine(song: Song): Engine {
  const ctx = new AudioContext();
  const master = new GainNode(ctx, { gain: 0.8 });
  master.connect(new DynamicsCompressorNode(ctx)).connect(ctx.destination); // keeps a busy step from clipping
  const noise = new AudioBuffer({ length: ctx.sampleRate, sampleRate: ctx.sampleRate }); // one second, shared by every noisy voice
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

  // A gain into the master: `peak` at time t, then a fall to silence over `decay` seconds.
  function envelope(t: number, peak: number, decay: number) {
    const gain = new GainNode(ctx);
    gain.gain.setValueAtTime(peak, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);
    gain.connect(master);
    return gain;
  }

  function tone(type: OscillatorType, freq: number, t: number, decay: number, peak: number) {
    const osc = new OscillatorNode(ctx, { type });
    osc.frequency.setValueAtTime(freq, t);
    osc.connect(envelope(t, peak, decay));
    osc.start(t);
    osc.stop(t + decay);
    return osc;
  }

  function hiss(type: BiquadFilterType, freq: number, t: number, decay: number, peak: number) {
    const src = new AudioBufferSourceNode(ctx, { buffer: noise });
    src.connect(new BiquadFilterNode(ctx, { type, frequency: freq })).connect(envelope(t, peak, decay));
    src.start(t);
    src.stop(t + decay);
  }

  // One voice per track, in TRACKS order: t is the time, v the track volume, i the step.
  const voices: ((t: number, v: number, i: number) => void)[] = [
    (t, v) => tone("sine", 150, t, 0.4, v).frequency.exponentialRampToValueAtTime(45, t + 0.1), // a falling sine
    (t, v) => { hiss("highpass", 1500, t, 0.16, v * 0.6); tone("triangle", 185, t, 0.08, v * 0.5); },
    (t, v) => [0, 0.012, 0.024].forEach((d, n) => hiss("bandpass", 1200, t + d, n < 2 ? 0.012 : 0.18, v * 0.9)), // three bursts, the last rings
    (t, v) => hiss("highpass", 7000, t, 0.05, v * 0.4),
    (t, v) => hiss("highpass", 7000, t, 0.3, v * 0.3),
    (t, v, i) => tone("sawtooth", BASS[i], t, 0.2, v * 0.3),
    (t, v, i) => tone("triangle", PLUCK[i], t, 0.25, v * 0.35),
  ];

  const queue: { step: number; time: number }[] = []; // booked steps, oldest first
  let timer: ReturnType<typeof setInterval> | undefined;
  let next = 0; // the next step to book
  let nextTime = 0; // when it sounds, on the AudioContext clock

  // Books every step that starts within the lookahead. A cell toggled now is heard the next time its step is booked.
  function book() {
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      song.pattern.forEach((row, track) => {
        const { volume, muted } = song.mix[track];
        if (row[next] && !muted) voices[track](nextTime, volume, next);
      });
      queue.push({ step: next, time: nextTime });
      // Swing lengthens even 16ths and shortens odd ones by the same amount, so every beat keeps its length.
      nextTime += (15 / song.bpm) * (next % 2 ? 1 - song.swing : 1 + song.swing);
      next = (next + 1) % STEPS;
    }
  }

  function stop() {
    clearInterval(timer);
    timer = undefined;
    queue.length = 0;
  }

  return {
    get playing() {
      return timer !== undefined;
    },
    // Steps are booked up to LOOKAHEAD early: the one heard is the last whose time has come.
    get step() {
      while (queue.length > 1 && queue[1].time <= ctx.currentTime) queue.shift();
      return queue.length && queue[0].time <= ctx.currentTime ? queue[0].step : -1;
    },
    play() {
      if (timer !== undefined) return;
      ctx.resume();
      next = 0;
      nextTime = ctx.currentTime + 0.05;
      book();
      timer = setInterval(book, TICK);
    },
    stop,
    dispose() {
      stop();
      ctx.close();
    },
  };
}
