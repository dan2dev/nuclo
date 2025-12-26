type ModType = Node | string | number | null | Record<string, any> | void;
type ModFnType = (parent: HTMLElement, index: number) => ModType;
type TextSource = string | number | (() => string | number | null | undefined);

let isHidrated = false;
function text(source: TextSource, initialValue?: string | number) {
  const isFn = typeof source === "function";
  const read = () => String(((isFn ? (source as () => any)() : source) as any) ?? "");

  return (parent: HTMLElement, index: number) => {
    let marker = parent.childNodes[index];
    if (marker?.nodeType !== Node.COMMENT_NODE) {
      marker = document.createComment(`text-${index}`);
      parent.insertBefore(marker, parent.childNodes[index] ?? null);
    }

    let node = marker.nextSibling;
    if (node?.nodeType !== Node.TEXT_NODE) {
      node = document.createTextNode("");
      parent.insertBefore(node, marker.nextSibling);
    }

    const textNode = node as Text;
    textNode.textContent = initialValue === undefined ? read() : String(initialValue);
    if (isFn) (textNode as any).update = () => (textNode.textContent = read());
    else delete (textNode as any).update;

    return [marker, textNode];
  };
}

type ModsArray = (ModType | ModFnType)[];
type ModsFunction = () => ModsArray;

function div(...modsOrFn: ModsArray | [ModsFunction]) {
  return function (parent: HTMLElement, index: number) {
    // Resolve os mods: se for função sem parâmetros (length === 0), é ModsFunction
    const isModsFunction = typeof modsOrFn[0] === "function"
      && modsOrFn.length === 1
      && (modsOrFn[0] as Function).length === 0;

    const mods: ModsArray = isModsFunction
      ? (modsOrFn[0] as ModsFunction)()
      : modsOrFn as ModsArray;

    // Reutiliza o elemento existente se possível
    let el = parent.childNodes[index] as HTMLDivElement | undefined;
    if (!(el instanceof HTMLDivElement) || el.tagName !== "DIV") {
      el = document.createElement("div");
      parent.insertBefore(el, parent.childNodes[index] || null);
    }
    let internalIndex = 0;

    for (let i = 0; i < mods.length; i++) {
      const mod = mods[i];
      if (mod == null) continue;

      let modItem: any = mod;
      if (typeof mod === "function") {
        modItem = (mod as ModFnType)(el, internalIndex);

        if (typeof modItem === "string" || typeof modItem === "number") {
          const modFn = mod as ModFnType;
          const nodeIndex = internalIndex;
          modItem = text(
            () => {
              const nextValue = modFn(el, nodeIndex);
              return typeof nextValue === "number" ? nextValue : String(nextValue ?? "");
            },
            modItem,
          )(el, nodeIndex);
        }
      } else if (typeof mod === "string" || typeof mod === "number") {
        modItem = text(mod)(el, internalIndex);
      }

      if (Array.isArray(modItem)) {
        for (let j = 0; j < modItem.length; j++) {
          if (modItem[j] instanceof Node) {
            // Sempre faz insertBefore, mas só se não estiver já na posição correta
            if (el.childNodes[internalIndex + j] !== modItem[j]) {
              el.insertBefore(modItem[j], el.childNodes[internalIndex + j] || null);
            }
          }
        }
        internalIndex += modItem.length;
      } else if (modItem instanceof Node) {
        // Sempre faz insertBefore, mas só se não estiver já na posição correta
        if (el.childNodes[internalIndex] !== modItem) {
          el.insertBefore(modItem, el.childNodes[internalIndex] || null);
        }
        internalIndex += 1;
      }
    }
    // Remove nodes extras se existirem
    while (el.childNodes.length > internalIndex) {
      el.removeChild(el.lastChild!);
    }
    return el;
  }
}

function mount(parent: HTMLElement, mod: ModFnType) {
  if (parent.children.length > 0) {
    mod(parent, 0);
    return;
  }
  parent.appendChild(mod(parent, 0) as Node);
}
function hydrate(parent: HTMLElement, mod: ModFnType) {
  mod(parent, 0);
  isHidrated = true;
}

function on(event: string, handler: (e: Event) => void) {
  return (parent: HTMLElement) => {
    if (isHidrated) {
      return;
    }
    parent.addEventListener(event, handler);
  };
}

function update() {
  document.querySelectorAll("*").forEach((el) =>
    el.childNodes.forEach((node) => (node as any).update?.()),
  );
  console.log("updated");
}

// root app
let valor = 0;
let labelStatico = "label statico inicial";
const rootDiv = document.getElementById("app") as HTMLElement;
const block1 = div(() => [
  div("header 1"),
  div("header 2"),
  (el) => el.style.setProperty("background-color", "red"),
  () => valor,
  div(div("div inside a div"), () => valor),
]);
const app = div(() => [
  "label1",
  () => "this should be in the rendered output, it is dynamic",
  () => valor,
  div(div("div inside a div"), () => valor),
  "hello there 2",
  div(text(() => valor)),
  block1,
  div("update", on("click", () => {
    valor += 1;
    update();
  })),
  div("update Statico", on("click", () => {
    // deve alterar o labelStatico no dom
    valor += 1;
    labelStatico = `label changed ${valor}`;
    mount(rootDiv, app);
  })),
  labelStatico,  // ✅ agora será re-avaliado a cada render
]);

// render - this part simulates SSR
// hydrate - this part simulates hydration

// render
mount(rootDiv, app);
rootDiv.innerHTML += "\n";
rootDiv.getElementsByTagName("div")[0].style.backgroundColor = "darkgray";
// hydrate
hydrate(rootDiv, app);
