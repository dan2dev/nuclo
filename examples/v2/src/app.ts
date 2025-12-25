type ModType = Node | string | number | null | Record<string, any> | void;
type ModFnType = (parent: HTMLElement, index: number) => ModType;
function text(
  content: (() => string | number) | string | number,
  initialValue?: string | number,
) {
  return function (parent: HTMLElement, index: number) {
    const hasUpdate = content instanceof Function;
    const textContent = hasUpdate
      ? String(initialValue ?? (content as () => string | number)())
      : String(content);
    let commentNode = parent.childNodes[index];
    let textNode = parent.childNodes[index + 1];

    // Garante que o comment node está na posição correta
    if (!commentNode || commentNode.nodeType !== Node.COMMENT_NODE) {
      console.log("this should not happen ever");
      commentNode = document.createComment(`text-${index}`);
      parent.insertBefore(commentNode, parent.childNodes[index] || null);
      // Atualiza textNode pois os índices mudaram
      textNode = parent.childNodes[index + 1];
    }

    // Garante que o text node está logo após o comment
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      textNode = document.createTextNode(textContent);
      parent.insertBefore(textNode, commentNode.nextSibling);
    }

    // Atualiza o conteúdo do text node
    (textNode as Text).textContent = textContent;
    if (hasUpdate) {
      console.log("Setting update function for text node:", textContent);
      (textNode as any).update = () => {
        const nextText = String((content as () => string | number)());
        (textNode as Text).textContent = nextText;
        return nextText;
      };
    }
    return [commentNode, textNode];
  }
}

function div(...mods: (ModType | ModFnType)[]) {
  return function (parent: HTMLElement, index: number) {
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
  // Se já existe um filho, tenta reconciliar, senão monta normalmente
  if (parent.children.length > 0) {
    mod(parent, 0); // Atualiza/reutiliza nodes existentes
  } else {
    const element = mod(parent, 0);
    parent.appendChild(element as Node);
  }
}

function on(event: string, handler: (e: Event) => void) {
  return function (parent: HTMLElement) {
    parent.addEventListener(event, handler);
  }
}

function update() {
  // update all nodes with update function
  const allNodes = document.querySelectorAll("*");
  allNodes.forEach((node) => {
    node.childNodes.forEach((child) => {
      if ((child as any).update instanceof Function) {
        console.log("Updating node:", child);
        (child as any).update();
      }
    });
  });
}


// root app
let valor = 0;
const rootDiv = document.getElementById("app") as HTMLElement;
const block1 = div(
  div("header 2"),
  div("header 2"),
  (el) => el.style.setProperty("background-color", "red"),
  () => valor,
  div(
    div("div inside a div"),
    () => valor,
  ),
);
const app = div(
  "label1",
  () => "this should be in the rendered output, it is dynamic",
  () => valor,
  div(

    div("div inside a div"),
    () => valor,
  ),
  "hello there 2",
  div(
    text(() => valor)
  ),
  block1,
  div(
    "button",
    on("click", () => {
      valor = valor + 1;
      console.log('Button clicked, updating text to:', valor);
      update();
    })
  )
);



// render - this part simulates SSR
// hydrate - this part simulates hydration

// render
mount(rootDiv, app);
rootDiv.innerHTML = rootDiv.innerHTML + "\n";
rootDiv.getElementsByTagName("div")[0].style.backgroundColor = "darkgray";
// hydrate
mount(rootDiv, app);

console.log("App mounted.");
