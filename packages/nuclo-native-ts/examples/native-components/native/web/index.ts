// The web side of examples/native-components: components are registered by name, and the
// exports are the functions the app declared.
import { type NativeComponent, registerNative } from "../../../../src/runtimes/web/index.ts";

interface SliderProps {
  value: number;
  min: number;
  max: number;
  tint?: string;
  onChange: (value: number) => void;
}

registerNative<SliderProps>("Slider", () => {
  let props: SliderProps | undefined;
  return {
    create() {
      const input = document.createElement("input");
      input.type = "range";
      input.step = "any";
      input.addEventListener("input", () => props?.onChange(Number(input.value)));
      return input;
    },
    update(element, next) {
      props = next;
      const input = element as HTMLInputElement;
      input.min = String(next.min);
      input.max = String(next.max);
      if (Number(input.value) !== next.value) input.value = String(next.value);
      input.style.accentColor = next.tint ?? "";
    },
  } satisfies NativeComponent<SliderProps>;
});

interface GaugeProps {
  progress: number;
  color: string;
  thickness: number;
}

registerNative<GaugeProps>("Gauge", () => ({
  create: () => document.createElement("canvas"),
  update(element, { progress, color, thickness }) {
    const canvas = element as HTMLCanvasElement;
    const size = canvas.clientWidth || 96;
    const scale = devicePixelRatio;
    canvas.width = canvas.height = size * scale;
    const g = canvas.getContext("2d")!;
    g.scale(scale, scale);
    g.lineWidth = thickness;
    g.lineCap = "round";
    const radius = (size - thickness) / 2;
    const ring = (from: number, to: number, stroke: string) => {
      g.beginPath();
      g.arc(size / 2, size / 2, radius, from, to);
      g.strokeStyle = stroke;
      g.stroke();
    };
    ring(0, Math.PI * 2, "#e2e8f0");
    if (progress > 0) ring(-Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, progress), color);
  },
}));

export function platformName(): string {
  return `the web (${navigator.platform})`;
}

export function vibrate(milliseconds: number): void {
  navigator.vibrate?.(milliseconds);
}

export async function batteryLevel(): Promise<number> {
  const getBattery = (navigator as { getBattery?: () => Promise<{ level: number }> }).getBattery;
  return getBattery ? (await getBattery.call(navigator)).level : -1;
}
