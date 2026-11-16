/**
 * A camera in a nuclo app: the platform's live preview as a typed native component, nuclo's UI around it.
 *
 *   Camera({ facing })   AVCaptureVideoPreviewLayer on iOS, Camera2 on a TextureView on Android, getUserMedia on the web
 *   requestCamera()      asks for the camera once; true when the app may use it
 *   takePhoto()          a JPEG of what the shown camera sees, as a URL an img() can show (file:// natively)
 *
 * The iOS simulator has no camera: there the preview is a drawn test card and a photo is a picture of it.
 */
import { button, css, div, img, list, native, render, span, update, when } from "../../src/index.ts";

interface CameraProps {
  /** "back" or "front". */
  facing: string;
}

const Camera = native<CameraProps>("Camera");

declare function requestCamera(): Promise<boolean>;
declare function takePhoto(): Promise<string>;

let access = "unknown"; // unknown | asking | granted | denied
let facing = "back";
let photos: string[] = [];
let shown = "";
let busy = false;
let flash = false;
let error = "";

async function ask() {
  access = "asking";
  update();
  access = (await requestCamera()) ? "granted" : "denied";
  update();
}

async function snap() {
  if (busy) return;
  busy = true;
  flash = true;
  error = "";
  update();
  try {
    const url = await takePhoto();
    if (url === "") throw new Error("No photo was taken");
    const next = photos.slice();
    next.unshift(url);
    photos = next.slice();
  } catch (e) {
    error = `${e}`;
  }
  busy = false;
  flash = false;
  update();
}

const round = css({ size: 56, rounded: 999, center: true, bg: "rgba(15, 23, 42, 0.55)", pressed: { opacity: 0.6 } });
const label = css({ color: "#ffffff", text: 15, weight: 600 });

const Viewfinder = () =>
  div(
    { style: { width: "100%", aspectRatio: 3 / 4, rounded: 20, overflow: "hidden", bg: "#0f172a" } },
    Camera({ facing: () => facing, style: { flex: 1 } }),
    // The white flash while a photo is taken: nuclo's view over the platform's.
    div({ style: () => ({ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, bg: "#ffffff", opacity: flash ? 0.7 : 0, transition: "opacity 120ms ease-out", pointerEvents: "none" }) }),
    div(
      { style: { position: "absolute", left: 0, right: 0, bottom: 16, row: true, justify: "space-evenly", items: "center" } },
      div(span("Flip", label), round, {
        onClick: () => {
          facing = facing === "back" ? "front" : "back";
          update();
        },
      }),
      div({
        style: () => ({ size: 72, rounded: 999, bg: "#ffffff", border: "4px solid rgba(15, 23, 42, 0.25)", opacity: busy ? 0.5 : 1, pressed: { scale: 0.92 }, transition: "transform 80ms ease-out" }),
        ariaLabel: "Take photo",
        onClick: () => snap(),
      }),
      div(span(() => `${photos.length}`, label), round, {
        onClick: () => {
          shown = photos[0] ?? "";
          update();
        },
      }),
    ),
  );

const Gallery = () =>
  div(
    { style: { gap: 8 } },
    span(() => (photos.length ? `${photos.length} photo${photos.length === 1 ? "" : "s"}` : "No photos yet"), { style: { color: "#64748b", text: 13 } }),
    div(
      { style: { row: true, gap: 8, flexWrap: "wrap" } },
      list(
        () => photos,
        (url) =>
          img({
            src: url,
            style: () => ({ size: 72, rounded: 10, objectFit: "cover", bg: "#e2e8f0", opacity: shown !== "" && shown !== url ? 0.45 : 1 }),
            onClick: () => {
              shown = shown === url ? "" : url;
              update();
            },
          }),
      ),
    ),
    when(
      () => shown !== "",
      div(
        { style: { gap: 8 } },
        img({ src: () => shown, style: { width: "100%", aspectRatio: 3 / 4, rounded: 16, objectFit: "cover", bg: "#e2e8f0" } }),
        button("Delete", {
          style: { alignSelf: "flex-start", color: "#dc2626", weight: 600, py: 8 },
          onClick: () => {
            photos = photos.filter((p) => p !== shown);
            shown = "";
            update();
          },
        }),
      ),
    ),
  );

const App = () =>
  div(
    { style: { p: 16, gap: 16, bg: "#f8fafc", maxWidth: 520, width: "100%", alignSelf: "center" } },
    span("Camera", { style: { text: 28, weight: "bold", color: "#0f172a" } }),
    when(
      () => access === "granted",
      Viewfinder(),
    ).else(
      div(
        { style: { width: "100%", aspectRatio: 3 / 4, rounded: 20, bg: "#0f172a", center: true, gap: 12, p: 24 } },
        span(() => (access === "denied" ? "Camera access was declined. Allow it in Settings to take photos." : "This app shows the camera to take photos."), {
          style: { color: "#cbd5e1", textAlign: "center", leading: 1.4 },
        }),
        when(
          () => access !== "denied",
          button(() => (access === "asking" ? "Asking…" : "Allow camera"), {
            disabled: () => access === "asking",
            style: { bg: "#ffffff", color: "#0f172a", rounded: 999, px: 20, py: 10, weight: 600 },
            onClick: () => ask(),
          }),
        ),
      ),
    ),
    when(() => error !== "", span(() => error, { style: { color: "#dc2626" } })),
    Gallery(),
  );

render(App);
