function tagBuilder(tag: string, ...tags: any[]) {

}
type ModType = Node | string | number | null | Record<string, any> | void;
type ModFnType = (parent: HTMLElement, index: number) => ModType;
function text(content: (() => string | number) | string | number) {
  return function (parent: HTMLElement, index: number) {
    const contentValue = typeof content === "function" ? content() : content;
    const el = parent.childNodes[index] as Text || document.createTextNode("");
    el.textContent = String(contentValue);
    return [el];
  }
}
function div(...mods: (ModType | ModFnType)[]) {
  return function (parent: HTMLElement, index: number) {
    const el = parent.children[index] as HTMLDivElement || document.createElement("div");
    let internalIndex = 0;

    // const compiledMods =;
    for (let i = 0; i < mods.length; i++) {
      // const mod = mods[i];
      const mod = mods[i];
      let modItem: ModType = mod;
      if (typeof mod === "function") {
        modItem = (mod as ModFnType)(el, internalIndex);
      }
      if (typeof modItem === "string" || typeof modItem === "number") {
        internalIndex += 2;
      }
    }
    return el;
  }
}