/**
 * Platform code inside a nuclo app, typed end to end.
 *
 *   native<P>("Name")   a view written per platform (native/<target>/), used like any builder.
 *                       P is an interface here; the compiler gives each platform a class for it,
 *                       so a prop the platform code misreads fails that platform's build.
 *   declare function    a function each platform implements under the same name and types.
 */
import { type Double, type Int, css, div, h2, native, p, render, small, span, update } from "../../src/index.ts";

/** The platform's own slider: SeekBar, UISlider, <input type="range">, GtkScale. */
interface SliderProps {
  value: Double;
  min: Double;
  max: Double;
  /** The track's colour, as a CSS hex colour. */
  tint?: string;
  onChange: (value: Double) => void;
}

/** A ring drawn by the platform's 2D API. */
interface GaugeProps {
  progress: Double;
  color: string;
  thickness: Double;
}

const Slider = native<SliderProps>("Slider");
const Gauge = native<GaugeProps>("Gauge");

/** The platform's name and version, e.g. "Android 16". */
declare function platformName(): string;
/** Vibrates (or does nothing where the platform can't). */
declare function vibrate(milliseconds: Int): void;
/** The battery level from 0 to 1, or -1 when the device has none. */
declare function batteryLevel(): Promise<Double>;

let volume = 40;
let battery = -2;
let buzzes = 0;

const card = css({ padding: 16, gap: 12, backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0" });
const muted = css({ color: "#64748b", fontSize: 13 });
const action = css({ color: "#4f46e5", fontWeight: "bold", paddingTop: 8, paddingBottom: 8, pressed: { opacity: 0.5 } });

async function readBattery() {
  battery = await batteryLevel();
  update();
}

const App = () =>
  div(
    { style: { padding: 20, gap: 16, backgroundColor: "#f1f5f9" } },
    div(
      card,
      h2("Native components"),
      div(
        { style: { flexDirection: "row", alignItems: "center", gap: 16 } },
        Gauge({
          progress: () => volume / 100,
          color: () => (volume > 80 ? "#dc2626" : "#4f46e5"),
          thickness: 10,
          style: { width: 96, height: 96 },
        }),
        div(
          { style: { flex: 1, gap: 4 } },
          span(() => `Volume ${Math.round(volume)}`, { style: { fontSize: 22, fontWeight: "bold" } }),
          small(() => (volume > 80 ? "Loud" : "Comfortable"), muted),
        ),
      ),
      Slider({
        value: () => volume,
        min: 0,
        max: 100,
        tint: "#4f46e5",
        onChange: (value) => {
          volume = value;
          update();
        },
        style: { height: 40 },
      }),
      small("The gauge and the slider are platform views; the text between them is nuclo's.", muted),
    ),
    div(
      card,
      h2("Native functions"),
      p(() => `Running on ${platformName()}`),
      p(() => (battery === -2 ? "Battery not read yet" : battery < 0 ? "No battery on this device" : `Battery at ${Math.round(battery * 100)}%`)),
      div(
        { style: { flexDirection: "row", gap: 20 } },
        span("Read battery", action, { onClick: () => readBattery() }),
        span(() => `Vibrate (${buzzes})`, action, {
          onClick: () => {
            vibrate(40);
            buzzes++;
            update();
          },
        }),
      ),
    ),
  );

render(App);
