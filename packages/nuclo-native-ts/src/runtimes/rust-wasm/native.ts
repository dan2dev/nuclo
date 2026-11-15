// What the app's platform code (native/wasm/index.ts, or the native/web/index.ts of the web target)
// imports on the wasm host, in place of the web runtime: the same two names, `registerNative` and
// `NativeComponent`, so that one file serves both targets. The build bundles that file with this
// module standing where `src/runtimes/web/index.ts` is imported from, and hands its exports to
// `provideNatives`: they are the functions the app declared with `declare function`.

/** What native/ registers for a component: it makes an element, and applies props when one changed. */
export interface NativeComponent<P> {
  create(): HTMLElement;
  update(element: HTMLElement, props: P): void;
  destroy?(element: HTMLElement): void;
}

export const registry = {
  components: new Map<string, () => NativeComponent<never>>(),
  functions: {} as Record<string, unknown>,
};

export function registerNative<P>(name: string, component: () => NativeComponent<P>): void {
  registry.components.set(name, component as () => NativeComponent<never>);
}

export function provideNatives(module: Record<string, unknown>): void {
  Object.assign(registry.functions, module);
}
