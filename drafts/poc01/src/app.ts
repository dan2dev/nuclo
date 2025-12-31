import text from "./lib/text";

// - Se o "mod" é uma função, deve chamar passando "parent" e "index".
// - Se o "mod" não é uma função, deve atribuir diretamente a "result".
// - Retornar "result".
// - comments has this pattern: `<!-- {type}:{size} -->` where {type} is either "text", "list" | "when" and {size} is how many nodes are managed by that comment block. For example: `<!-- text:1 -->` means that this comment manages 1 text node. On lists, the size is dynamic and can be 0 or more. For example: `<!-- list:0 -->` means that this comment manages 0 or more nodes. This is useful for hydration and diffing.


type ModType = Node | string | number | null | Record<string, any> | void;
type ModFnType = (parent: HTMLElement, index: number) => ModType;

let isHidrated = false;
let firstRender = true;
// let domData: Record<string, any> = {

// }

(Comment.prototype as any).bind1 = function (key: string, value: any) {
  // if (!domData[this.nodeValue || ""]) {
  //   domData[this.nodeValue || ""] = {};
  // }
  // domData[this.nodeValue || ""][key] = value;
}

function when(condition: () => boolean, mod: ModType | ModFnType) {
  return function (parent: HTMLElement, index: number) {
    let marker = parent.childNodes[index];

    if (marker?.nodeType !== Node.COMMENT_NODE) {
      marker = document.createComment(`when-${index}`);
      parent.insertBefore(marker, parent.childNodes[index] ?? null);
    }
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

    const modsArray: ModsArray = isModsFunction
      ? (modsOrFn[0] as ModsFunction)()
      : modsOrFn as ModsArray;

    // Reutiliza o elemento existente se possível
    let el = parent.childNodes[index] as HTMLDivElement | undefined;
    if (!(el instanceof HTMLDivElement) || el.tagName !== "DIV") {
      el = document.createElement("div");
      parent.insertBefore(el, parent.childNodes[index] || null);
    }
    let nodeIndex = 0;

    for (let i = 0; i < modsArray.length; i++) {
      const mod = modsArray[i];
      if (mod == null) continue;

      let modItem: any = mod;
      // PART 1
      // compute modItem if it's a function
      if (typeof mod === "function") {
        modItem = (mod as ModFnType)(el, nodeIndex);

        if (typeof modItem === "string" || typeof modItem === "number") {
          const modFn = mod as ModFnType;
          modItem = text(
            () => {
              const nextValue = modFn(el, nodeIndex);
              return typeof nextValue === "number" ? nextValue : String(nextValue ?? "");
            },
            modItem,
          )(el, nodeIndex);
        }
      } else if (typeof mod === "string" || typeof mod === "number" || typeof mod === "boolean") {
        modItem = text(mod)(el, nodeIndex);
      }
      // ----------------------------------------------
      // PART 2
      // insert modItem into DOM - array of Nodes case
      if (Array.isArray(modItem)) {
        for (let j = 0; j < modItem.length; j++) {
          if (modItem[j] instanceof Node) {
            // Sempre faz insertBefore, mas só se não estiver já na posição correta
            if (el.childNodes[nodeIndex + j] !== modItem[j]) {
              el.insertBefore(modItem[j], el.childNodes[nodeIndex + j] || null);
            }
          }
        }
        nodeIndex += modItem.length;
      }
      // PART 2
      // insert modItem into DOM - single Node case
      else if (modItem instanceof Node) {
        // Sempre faz insertBefore, mas só se não estiver já na posição correta
        if (el.childNodes[nodeIndex] !== modItem) {
          el.insertBefore(modItem, el.childNodes[nodeIndex] || null);
        }
        nodeIndex += 1;
      }
    }
    // Remove nodes extras se existirem
    while (el.childNodes.length > nodeIndex) {
      console.log("removing extra node");
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
  // console.log("updated");
}

// root app
let valor = 0;
let labelStatico = "label statico inicial";
const rootDiv = document.getElementById("app") as HTMLElement;
const block1 = div(() => [
  div("header 1"),
  div("header 2"),
  (el: HTMLElement) => {
    if (isHidrated) {
      el.style.setProperty("background-color", "red");
    }
  },
  () => valor,
  div(div("div inside a div"), () => valor),
]);
const app = div(() => [
  "label1",
  () => "this should be in the rendered output, it is dynamic",
  () => valor,
  div(div("div inside a div"), () => valor),
  "hello there 2",
  null,
  {},
  div(text(() => valor)),
  block1,
  div("update", on("click", () => {
    valor += 1;
    console.time("update");
    update();
    console.timeEnd("update");
  })),
  div("update Statico", on("click", () => {
    // deve alterar o labelStatico no dom
    valor += 1;
    labelStatico = `label changed ${valor}`;
    console.time("hydrate");
    hydrate(rootDiv, app);
    console.timeEnd("hydrate");
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
setTimeout(() => {
  console.time("hydrate");
  for (let i = 0; i < 1000; i++) {
    hydrate(rootDiv, app);
  }
  console.timeEnd("hydrate");
  // update();
}, 2000);
