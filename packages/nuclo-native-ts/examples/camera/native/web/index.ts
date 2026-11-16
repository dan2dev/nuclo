// The web side of examples/camera: a <video> on getUserMedia, and a photo drawn from it to a canvas.
// Browsers allow the camera on https:// and on localhost only.
import { type NativeComponent, registerNative } from "../../../../src/runtimes/web/index.ts";

interface CameraProps {
  facing: string;
}

/** The camera on screen, which takePhoto() asks. The last one created wins. */
let live: HTMLVideoElement | undefined;

const stop = (video: HTMLVideoElement) => {
  for (const track of (video.srcObject as MediaStream | null)?.getTracks() ?? []) track.stop();
  video.srcObject = null;
};

registerNative<CameraProps>("Camera", () => {
  let facing = "";
  return {
    create() {
      const video = document.createElement("video");
      video.autoplay = video.muted = video.playsInline = true;
      video.style.objectFit = "cover";
      live = video;
      return video;
    },
    update(element, props) {
      if (props.facing === facing) return;
      facing = props.facing;
      const video = element as HTMLVideoElement;
      stop(video);
      // Mirrored, as a front camera's preview is everywhere else.
      video.style.transform = facing === "front" ? "scaleX(-1)" : "";
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: facing === "front" ? "user" : "environment", aspectRatio: 3 / 4 } })
        .then((stream) => {
          if (facing === props.facing) video.srcObject = stream;
          else for (const track of stream.getTracks()) track.stop();
        })
        .catch((error) => console.warn("camera:", error));
    },
    destroy(element) {
      stop(element as HTMLVideoElement);
      if (live === element) live = undefined;
    },
  } satisfies NativeComponent<CameraProps>;
});

export async function requestCamera(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    for (const track of stream.getTracks()) track.stop();
    return true;
  } catch {
    return false;
  }
}

export async function takePhoto(): Promise<string> {
  const video = live;
  if (!video?.isConnected || !video.videoWidth) throw new Error("No camera is shown");
  // What the preview shows: the frame cropped to the element's shape (object-fit: cover), mirrored like it.
  const scale = Math.max(video.clientWidth / video.videoWidth, video.clientHeight / video.videoHeight);
  const w = Math.round(video.clientWidth / scale);
  const h = Math.round(video.clientHeight / scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!;
  if (video.style.transform) g.setTransform(-1, 0, 0, 1, w, 0);
  g.drawImage(video, (video.videoWidth - w) / 2, (video.videoHeight - h) / 2, w, h, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", 0.9));
  if (!blob) throw new Error("The photo has no data");
  return URL.createObjectURL(blob);
}
