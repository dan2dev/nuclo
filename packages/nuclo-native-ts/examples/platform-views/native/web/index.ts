// The web side of examples/platform-views.
import { type NativeComponent, registerNative } from "../../../../src/runtimes/web/index.ts";

interface WebViewProps {
  url: string;
  onLoad: (title: string) => void;
}

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
}

registerNative<WebViewProps>("WebView", () => {
  let props: WebViewProps | undefined;
  return {
    create() {
      const frame = document.createElement("iframe");
      frame.style.border = "0";
      // A page from another origin hides its title from this one: the host stands in for it.
      frame.addEventListener("load", () => props && props.onLoad(new URL(props.url).host));
      return frame;
    },
    update(element, next) {
      props = next;
      const frame = element as HTMLIFrameElement;
      if (frame.src !== next.url) frame.src = next.url;
    },
  } satisfies NativeComponent<WebViewProps>;
});

registerNative<DatePickerProps>("DatePicker", () => {
  let props: DatePickerProps | undefined;
  return {
    create() {
      const input = document.createElement("input");
      input.type = "date";
      input.addEventListener("change", () => input.value && props?.onChange(input.value));
      return input;
    },
    update(element, next) {
      props = next;
      const input = element as HTMLInputElement;
      if (input.value !== next.value) input.value = next.value;
    },
  } satisfies NativeComponent<DatePickerProps>;
});

export function daysUntil(date: string): number {
  const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
  const now = new Date();
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
}

export async function share(text: string): Promise<string> {
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return "Shared";
    }
    await navigator.clipboard.writeText(text);
    return "Copied to the clipboard";
  } catch {
    return "Not shared";
  }
}
