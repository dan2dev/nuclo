import { on } from "nuclo";
import type {} from "./host";

/** Use a registered native view, or render the app's fallback on other hosts. Provide a size through style. */
export function nativeView<P extends object, E>(
  name: string,
  options: {
    props: ValueOrFactory<P>;
    style: ValueOrFactory<CSSStyleObject>;
    fallback: DetachedExpandedElementFactory<"div">;
    onEvent?: (event: E) => void;
  },
): DetachedExpandedElementFactory<"div"> {
  const names = globalThis.__nuclo_device?.("nativeViews")?.split("\n");
  if (!names?.includes(name)) return options.fallback;
  const props = options.props;
  return div(
    {
      "data-native": `native:${name}`,
      "native-props": () => JSON.stringify(typeof props === "function" ? props() : props),
      style: options.style,
    },
    on<"nativeevent", CustomEvent<E>, "div">("nativeevent", (event) => options.onEvent?.(event.detail)),
  );
}
