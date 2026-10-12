import "nuclo";
import { duplicate, exportHtml, flatten, imageUrl, kinds, makeBlock, moveTo, parentOf, starter, type Block, type Kind } from "./model.ts";
import { s } from "./styles.ts";

const paths = {
  section: "M3 3h18v18H3z M3 9h18 M9 9v12", heading: "M5 4v16 M19 4v16 M5 12h14",
  text: "M4 5h16 M12 5v15 M8 20h8", button: "M3 7h18v10H3z M8 12h8",
  image: "M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M16 7h.01", divider: "M3 12h18",
  plus: "M12 5v14 M5 12h14", undo: "M9 5l-5 5 5 5 M4 10h10a6 6 0 010 12",
  redo: "M15 5l5 5-5 5 M20 10H10a6 6 0 000 12", grip: "M9 5h.01 M15 5h.01 M9 12h.01 M15 12h.01 M9 19h.01 M15 19h.01",
};
function Icon(name: keyof typeof paths) {
  return svgSvg({ width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" }, pathSvg({ d: paths[name] }));
}

export function PageBuilder() {
  // State belongs to this editor instance, including its undo history.
  let root = starter();
  let selectedId = root.children[0].children[0].id;
  let adding = false;
  let preview = false;
  let phone = false;
  let status = "Your changes stay here while this example is open.";
  let snapshots = [JSON.stringify(root)];
  let cursor = 0;
  let editingKey: string | undefined;
  let cssProperty = "";
  let cssValue = "";
  let appElement: HTMLElement | undefined;
  const editors = new Map<string, HTMLElement>();
  let popup: { type: "blocks" | "context"; x: number; y: number; focus: HTMLElement | null; range: Range | null } | null = null;
  let menuQuery = "";
  let menuIndex = 0;
  let drag: { block: Block; source: HTMLElement; pointerId: number; startX: number; startY: number; x: number; y: number; active: boolean } | null = null;
  let dropTarget: { owner: Block; index: number; block: Block; position: "before" | "after" | "inside"; axis: "x" | "y"; surface: "canvas" | "outline" } | null = null;
  let suppressClick = false;
  let dragFrame = 0;
  const selected = () => flatten(root).find((block) => block.id === selectedId) ?? root;
  const parent = () => parentOf(root, selected().id);
  const siblings = () => parent()?.children ?? [];

  function commit(change: () => void, mergeKey?: string) {
    change();
    const snapshot = JSON.stringify(root);
    if (snapshot !== snapshots[cursor]) {
      if (mergeKey && mergeKey === editingKey && cursor === snapshots.length - 1) snapshots[cursor] = snapshot;
      else {
        snapshots = snapshots.slice(0, cursor + 1);
        snapshots.push(snapshot);
      }
      if (snapshots.length > 100) snapshots.shift();
      cursor = snapshots.length - 1;
      status = "Changes applied · undo is available";
    }
    editingKey = mergeKey;
    update();
    syncEditors();
  }
  function travel(offset: number) {
    if (drag) cancelDrag();
    const next = cursor + offset;
    if (next < 0 || next >= snapshots.length) return;
    editingKey = undefined;
    cursor = next;
    root = JSON.parse(snapshots[cursor]) as Block;
    if (!flatten(root).some((block) => block.id === selectedId)) selectedId = root.id;
    status = offset < 0 ? "Change undone" : "Change restored";
    popup = null;
    update();
    focusBlock(selected());
  }
  function pick(block: Block) { editingKey = undefined; selectedId = block.id; adding = false; popup = null; update(); }
  function add(kind: Kind, content?: string, replaceEmpty = false) {
    let added: Block;
    commit(() => {
      const current = selected();
      const block = makeBlock(kind);
      if (content !== undefined && ["heading", "text", "button"].includes(kind)) block.content = content;
      added = block;
      if (replaceEmpty && current.kind === "text" && !current.content.trim()) {
        const owner = parent()!;
        block.id = current.id;
        owner.children.splice(owner.children.indexOf(current), 1, block);
      } else if (current.kind === "section") current.children.push(block);
      else {
        const owner = parent()!;
        owner.children.splice(owner.children.indexOf(current) + 1, 0, block);
      }
      selectedId = block.id;
      adding = false;
      popup = null;
    });
    focusBlock(added!);
  }
  function remove() {
    if (selected() === root) return;
    commit(() => {
      const owner = parent()!;
      owner.children.splice(owner.children.indexOf(selected()), 1);
      selectedId = owner.id;
    });
  }
  function copy() {
    if (selected() === root) return;
    commit(() => {
      const owner = parent()!;
      const block = duplicate(selected());
      owner.children.splice(owner.children.indexOf(selected()) + 1, 0, block);
      selectedId = block.id;
    });
  }
  function reorder(offset: number) {
    const items = siblings();
    const index = items.indexOf(selected());
    if (index < 0 || index + offset < 0 || index + offset >= items.length) return;
    commit(() => { const [block] = items.splice(index, 1); items.splice(index + offset, 0, block); });
  }
  function styleDraft(key: string, value: string) {
    const property = key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
    if (value && !CSS.supports(property, value)) return false;
    commit(() => {
      if (value) selected().styles[key] = value;
      else delete selected().styles[key];
    }, `${selectedId}:${key}`);
    return true;
  }
  function setStyle(key: string, value: string) {
    if (!styleDraft(key, value.trim())) {
      status = "That style value is not valid. Try a value like 24px, 100% or auto.";
      update();
      return;
    }
    commit(() => {});
  }
  function layout(mode: "stack" | "row" | "grid") {
    commit(() => {
      const styles = selected().styles;
      styles.display = mode === "grid" ? "grid" : "flex";
      styles.flexDirection = mode === "row" ? "row" : "column";
      if (mode === "grid") styles.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
      else delete styles.gridTemplateColumns;
      if (mode === "row") styles.flexWrap = "wrap";
      else delete styles.flexWrap;
    });
  }
  function download() {
    const url = URL.createObjectURL(new Blob([exportHtml(root)], { type: "text/html" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "your-page.html";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status = "HTML exported · open your-page.html in a browser";
    update();
  }
  function syncEditors() {
    for (const block of flatten(root)) {
      const element = editors.get(block.id);
      // The browser owns the active text and caret; update() owns everything around it.
      if (element && document.activeElement !== element && element.innerText !== block.content) element.textContent = block.content;
    }
  }
  function focusBlock(block: Block) {
    queueMicrotask(() => {
      const element = editors.get(block.id) ?? appElement?.querySelector<HTMLElement>(`[data-pb-block="${block.id}"]`);
      if (!element?.isConnected) return;
      element.focus();
      if (editors.has(block.id)) {
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });
  }
  function closePopup(restore = true) {
    const previous = popup;
    popup = null;
    update();
    if (!restore || !previous) return;
    if (previous.focus?.isConnected) previous.focus.focus();
    else focusBlock(selected());
    if (previous.range?.startContainer.isConnected) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(previous.range);
    }
  }
  function openPopup(type: "blocks" | "context", block: Block, point?: { x: number; y: number }) {
    if (preview) return;
    const selection = window.getSelection();
    const range = selection?.rangeCount && editors.get(block.id)?.contains(selection.anchorNode) ? selection.getRangeAt(0).cloneRange() : null;
    const caret = range?.getBoundingClientRect();
    const anchor = caret?.height ? caret : appElement?.querySelector(`[data-pb-block="${block.id}"]`)?.getBoundingClientRect();
    const bounds = appElement?.getBoundingClientRect();
    const left = Math.max(8, bounds?.left ?? 8);
    const top = Math.max(8, bounds?.top ?? 8);
    const right = Math.min(window.innerWidth - 8, bounds?.right ?? window.innerWidth - 8);
    const bottom = Math.min(window.innerHeight - 8, bounds?.bottom ?? window.innerHeight - 8);
    selectedId = block.id;
    editingKey = undefined;
    adding = false;
    menuQuery = "";
    menuIndex = 0;
    popup = {
      type,
      x: Math.max(left, Math.min(point?.x ?? anchor?.left ?? left, right - Math.min(300, right - left))),
      y: Math.max(top, Math.min(point?.y ?? anchor?.bottom ?? top, bottom - Math.min(360, bottom - top))),
      focus: document.activeElement instanceof HTMLElement ? document.activeElement : null,
      range,
    };
    update();
    queueMicrotask(() => appElement?.querySelector<HTMLElement>(type === "blocks" ? "[data-pb-menu] input" : "[data-pb-menu] button:not(:disabled)")?.focus());
  }
  function insertParagraph(block: Block, content = "") {
    selectedId = block.id;
    add("text", content);
  }
  function Editable(block: Block) {
    return span(s.editable,
      { "data-pb-editable": block.id, contentEditable: () => preview ? "false" : "plaintext-only", role: "textbox", "aria-label": () => `Edit ${block.name}`, "aria-multiline": "true", "aria-readonly": () => String(preview), "data-placeholder": "Type something, or / for blocks", spellcheck: true, tabIndex: () => preview ? -1 : 0,
        onFocus: () => { selectedId = block.id; editingKey = undefined; update(); },
        onBlur: () => { editingKey = undefined; },
        onInput: (event) => { commit(() => { block.content = event.currentTarget.innerText; }, `${block.id}:content`); },
        onKeyDown: (event: KeyboardEvent) => {
          if (preview || event.isComposing) return;
          // Keep caret keys inside the editor instead of the example modal's pager.
          event.stopPropagation();
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); travel(event.shiftKey ? 1 : -1); return; }
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") { event.preventDefault(); copy(); focusBlock(selected()); return; }
          if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) { event.preventDefault(); openPopup("context", block); return; }
          if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault(); event.stopPropagation(); openPopup("blocks", block);
          } else if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault(); event.stopPropagation();
            const element = event.currentTarget as HTMLElement;
            const selection = window.getSelection();
            let tail = "";
            if (selection?.rangeCount && element.contains(selection.anchorNode) && element.contains(selection.focusNode)) {
              const caret = selection.getRangeAt(0);
              const before = document.createRange();
              before.selectNodeContents(element);
              before.setEnd(caret.startContainer, caret.startOffset);
              const after = document.createRange();
              after.selectNodeContents(element);
              after.setStart(caret.endContainer, caret.endOffset);
              block.content = before.toString();
              tail = after.toString();
              element.textContent = block.content;
            }
            insertParagraph(block, tail);
          }
        },
      },
      block.content,
      on("mount", (element) => { if (element.textContent !== block.content) element.textContent = block.content; editors.set(block.id, element); return () => { if (editors.get(block.id) === element) editors.delete(block.id); }; }),
    );
  }
  const blockChoices = () => kinds.filter((entry) => `${entry.label} ${entry.hint}`.toLowerCase().includes(menuQuery.toLowerCase()));
  function runMenu(action: () => void) { closePopup(false); action(); if (!popup) focusBlock(selected()); }
  function Popup() {
    return div(s.popup,
      { "data-pb-menu": "", role: () => popup?.type === "blocks" ? "dialog" : "menu", "aria-label": () => popup?.type === "blocks" ? "Insert a block" : "Block actions", style: () => ({ left: `${popup?.x ?? 0}px`, top: `${popup?.y ?? 0}px` }),
        onKeyDown: (event: KeyboardEvent) => {
          event.stopPropagation();
          if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closePopup(); return; }
          if (event.key === "Tab") { closePopup(); return; }
          if (popup?.type === "blocks") {
            const choices = blockChoices();
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault(); menuIndex = choices.length ? (menuIndex + (event.key === "ArrowDown" ? 1 : -1) + choices.length) % choices.length : 0; update();
              appElement?.querySelector('[data-pb-menu] [aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
            } else if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
              event.preventDefault(); const choice = choices[menuIndex]; if (choice) runMenu(() => add(choice.kind, "", true));
            }
          } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const buttons = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
            const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
            const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
            buttons[next]?.focus();
          }
        },
      },
      when(() => popup?.type === "blocks", div(
        div(s.popupHead, strong("Add a block"), span(s.hint, "Esc to cancel")),
        input(s.menuSearch, { "aria-label": "Search blocks", placeholder: "Search blocks…", value: () => menuQuery, "aria-controls": "pb-block-options", "aria-activedescendant": () => blockChoices()[menuIndex] ? `pb-option-${blockChoices()[menuIndex].kind}` : "", onInput: (event) => { menuQuery = event.currentTarget.value; menuIndex = 0; update(); } }),
        div(s.menuList, { role: "listbox", id: "pb-block-options", "aria-label": "Block types" }, list(blockChoices, (entry) => button(() => cx(s.menuItem, blockChoices()[menuIndex] === entry && s.menuSelected), { id: `pb-option-${entry.kind}`, role: "option", "aria-selected": () => String(blockChoices()[menuIndex] === entry), onClick: () => runMenu(() => add(entry.kind, "", true)) }, Icon(entry.kind), div(strong(entry.label), small(entry.hint)))),
          when(() => !blockChoices().length, p(s.hint, "No blocks found. Try heading, text or layout."))),
        p(s.menuFoot, "↑ ↓ to choose · Enter to insert"),
      )).else(div(
        div(s.popupHead, strong(() => selected().name), span(s.hint, "Block actions")),
        button(s.menuItem, { role: "menuitem", onClick: () => openPopup("blocks", selected(), popup ? { x: popup.x, y: popup.y } : undefined) }, Icon("plus"), "Add a block"),
        button(s.menuItem, { role: "menuitem", disabled: () => selected() === root, onClick: () => runMenu(copy) }, Icon("section"), "Duplicate"),
        button(s.menuItem, { role: "menuitem", disabled: () => siblings().indexOf(selected()) <= 0, onClick: () => runMenu(() => reorder(-1)) }, Icon("undo"), "Move up"),
        button(s.menuItem, { role: "menuitem", disabled: () => selected() === root || siblings().indexOf(selected()) === siblings().length - 1, onClick: () => runMenu(() => reorder(1)) }, Icon("redo"), "Move down"),
        button(s.menuItem, { role: "menuitem", disabled: () => selected() === root, onClick: () => runMenu(() => { const owner = parent(); if (owner) { pick(owner); focusBlock(owner); } }) }, Icon("section"), "Select parent"),
        when(() => selected().kind === "section", div(s.menuDivider, ...([ ["stack", "Stack layout"], ["row", "Flex row"], ["grid", "Grid layout"] ] as const).map(([mode, name]) => button(s.menuItem, { role: "menuitem", onClick: () => runMenu(() => layout(mode)) }, Icon("section"), name)))),
        button(s.menuItem, s.menuDanger, { role: "menuitem", disabled: () => selected() === root, onClick: () => runMenu(remove) }, Icon("divider"), "Delete block"),
      )),
    );
  }

  const action = (text: string, fn: () => void) => button(s.btn, { type: "button", onClick: fn }, text);

  function beginDrag(event: PointerEvent, block: Block) {
    if (preview || block === root || event.button !== 0) return;
    event.stopPropagation();
    const source = event.currentTarget as HTMLElement;
    drag = { block, source, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, active: false };
    source.setPointerCapture(event.pointerId);
  }
  function cancelDrag() {
    const previous = drag;
    cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    drag = null;
    dropTarget = null;
    if (previous?.source.hasPointerCapture(previous.pointerId)) previous.source.releasePointerCapture(previous.pointerId);
    update();
  }
  function dragMove(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!drag.active && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
    event.preventDefault();
    if (!drag.active) { drag.active = true; selectedId = drag.block.id; editingKey = undefined; popup = null; adding = false; }
    drag.x = event.clientX;
    drag.y = event.clientY;
    dropTarget = null;
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const element = hit?.closest<HTMLElement>("[data-pb-layer], [data-pb-block]");
    const id = element?.getAttribute("data-pb-layer") ?? element?.getAttribute("data-pb-block");
    const block = flatten(root).find((item) => item.id === id);
    if (element && block && appElement?.contains(element) && !flatten(drag.block).includes(block)) {
      const surface = element.hasAttribute("data-pb-layer") ? "outline" : "canvas";
      const owner = parentOf(root, block.id);
      const rect = element.getBoundingClientRect();
      const layoutStyle = surface === "canvas" && element.parentElement ? getComputedStyle(element.parentElement) : null;
      const horizontal = layoutStyle?.display === "flex" && layoutStyle.flexDirection.startsWith("row") || layoutStyle?.display === "grid" && layoutStyle.gridTemplateColumns.split(" ").length > 1;
      const axis = horizontal ? "x" : "y";
      const fraction = horizontal ? (event.clientX - rect.left) / Math.max(1, rect.width) : (event.clientY - rect.top) / Math.max(1, rect.height);
      const inside = block.kind === "section" && (block === root || hit?.closest("[data-pb-append]") || fraction > 0.22 && fraction < 0.78);
      if (inside) dropTarget = { owner: block, index: block.children.length, block, position: "inside", axis, surface };
      else if (owner) dropTarget = { owner, index: owner.children.indexOf(block) + (fraction > 0.5 ? 1 : 0), block, position: fraction > 0.5 ? "after" : "before", axis, surface };
      if (dropTarget && flatten(drag.block).includes(dropTarget.owner)) dropTarget = null;
    }
    cancelAnimationFrame(dragFrame);
    // Keep scrolling while the pointer stays near an edge, even if it stops moving.
    const scroller = hit?.closest<HTMLElement>(".pb-stage, .pb-outline");
    if (scroller) {
      const rect = scroller.getBoundingClientRect();
      const speed = event.clientY < rect.top + 36 ? -14 : event.clientY > rect.bottom - 36 ? 14 : 0;
      if (speed) { scroller.scrollBy(0, speed); dragFrame = requestAnimationFrame(() => dragMove(event)); }
    }
    update();
  }
  function endDrag(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const block = drag.block;
    const target = dropTarget;
    const active = drag.active;
    cancelDrag();
    if (!active) return;
    event.preventDefault();
    suppressClick = true;
    if (target) {
      commit(() => {
        if (moveTo(root, block, target.owner, target.index)) {
          selectedId = block.id;
          status = `Moved ${block.name} ${target.position === "inside" ? "into" : target.position} ${target.block.name}`;
        }
      });
    } else { status = "Move cancelled · drop beside a block or inside a layout"; update(); }
  }
  function dragAttributes(block: Block, surface: "canvas" | "outline") {
    return {
      "data-pb-dragging": () => String(drag?.active && drag.block === block || false),
      "data-pb-drop": () => dropTarget?.block === block && dropTarget.surface === surface ? dropTarget.position : "none",
      "data-pb-axis": () => dropTarget?.axis ?? "y",
    };
  }

  function Layer(block: Block, depth = 0): ReturnType<typeof div> {
    return div(
      button(() => cx(s.layer, selectedId === block.id && s.selectedLayer), { ...dragAttributes(block, "outline"), "data-pb-layer": block.id, type: "button", style: { paddingLeft: `${8 + depth * 12}px` }, "aria-pressed": () => String(selectedId === block.id), onClick: () => pick(block), onContextMenu: (event) => { event.preventDefault(); openPopup("context", block, { x: event.clientX, y: event.clientY }); } }, span(s.layerGrip, { style: { visibility: block === root ? "hidden" : "visible" }, title: "Drag to move this block", "aria-hidden": "true", onPointerDown: (event: PointerEvent) => beginDrag(event, block) }, Icon("grip")), Icon(block.kind), span(() => block.name)),
      list(() => block.children, (child) => Layer(child, depth + 1)),
    );
  }
  function RenderBlock(block: Block): ReturnType<typeof div> {
    // Send empty values for removed properties: Nuclo patches style keys in place.
    const applied = new Set(Object.keys(block.styles));
    const blockStyle = () => {
      Object.keys(block.styles).forEach((key) => applied.add(key));
      return Object.fromEntries([...applied].map((key) => [key, block.styles[key] ?? ""]));
    };
    const attrs = {
      ...dragAttributes(block, "canvas"),
      "data-pb-block": block.id, "data-pb-kind": block.kind,
      "data-pb-selected": () => String(!preview && selectedId === block.id),
      style: blockStyle,
      tabIndex: () => preview || ["heading", "text", "button"].includes(block.kind) ? -1 : 0,
      "aria-label": () => preview ? null : `Select ${block.name}`,
      onClick: (event: MouseEvent) => { if (!preview) { event.stopPropagation(); pick(block); } },
      onContextMenu: (event: MouseEvent) => { if (!preview) { event.preventDefault(); event.stopPropagation(); openPopup("context", block, { x: event.clientX, y: event.clientY }); } },
      onKeyDown: (event: KeyboardEvent) => {
        if (preview || event.defaultPrevented || event.isComposing) return;
        if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) { event.preventDefault(); event.stopPropagation(); openPopup("context", block); }
        else if (event.target === event.currentTarget && !event.ctrlKey && !event.metaKey && !event.altKey) {
          if (event.key === "/") { event.preventDefault(); event.stopPropagation(); openPopup("blocks", block); }
          else if (block.kind === "section" && (event.key === "Enter" || event.key.length === 1)) { event.preventDefault(); event.stopPropagation(); insertParagraph(block, event.key === "Enter" ? "" : event.key); }
        }
      },
    };
    const handle = button({ type: "button", "data-pb-handle": "", title: block === root ? "Page actions" : "Drag to move · click for block actions", style: { cursor: block === root ? "pointer" : "grab" }, onPointerDown: (event: PointerEvent) => beginDrag(event, block), "aria-label": () => `Block options for ${block.name}`, tabIndex: () => preview ? -1 : 0, onClick: (event: MouseEvent) => { event.stopPropagation(); openPopup("context", block); } }, Icon("grip"));
    if (block.kind === "section") return section(attrs, handle, list(() => block.children, RenderBlock), when(() => !preview, button(s.composer, { type: "button", "data-pb-append": block.id, "aria-label": () => `Write inside ${block.name}`, title: "Click to write, or press / to choose a block", onClick: (event: MouseEvent) => { event.stopPropagation(); insertParagraph(block); }, onKeyDown: (event: KeyboardEvent) => { if (event.key === "/") { event.preventDefault(); event.stopPropagation(); openPopup("blocks", block); } } }, Icon("plus"), "Add content")));
    if (block.kind === "heading") return h2(attrs, handle, Editable(block));
    if (block.kind === "text") return p(attrs, handle, Editable(block));
    if (block.kind === "button") return div(attrs, handle, when(() => !preview, Editable(block)).else(button({ type: "button", style: { backgroundColor: "transparent", color: "inherit", font: "inherit", padding: "0", width: "100%", textAlign: "inherit" }, tabIndex: () => preview ? 0 : -1 }, () => block.content)));
    if (block.kind === "image") return div(attrs, handle,
      when(() => !!imageUrl(block.content), img({ draggable: false, src: () => imageUrl(block.content), alt: () => block.name, style: { width: "100%", height: "100%", objectFit: "inherit", borderRadius: "inherit" }, onError: () => { status = "Image could not load. Check its URL in the properties panel."; update(); } })),
      when(() => !imageUrl(block.content), div({ "data-pb-image-empty": "", style: { height: "100%" } }, Icon("image"), "Add an image URL")));
    return div(attrs, handle);
  }
  function Field(name: string, key: string, placeholder = "", wide = false) {
    return label(s.field, wide ? s.wide : null, span(name), input({ value: () => selected().styles[key] ?? "", placeholder, onInput: (event) => { styleDraft(key, event.currentTarget.value); }, onChange: (event) => setStyle(key, event.currentTarget.value) }));
  }
  function Choice(name: string, key: string, choices: [string, string][]) {
    return label(s.field, span(name), select({ "aria-label": name, value: () => selected().styles[key] ?? "", onChange: (event) => setStyle(key, event.currentTarget.value) }, option({ value: "" }, "Default"), ...choices.map(([value, text]) => option({ value }, text))));
  }
  function Color(name: string, key: string, fallback: string) {
    return label(s.field, span(name), input({ type: "color", onInput: (event) => { styleDraft(key, event.currentTarget.value); }, value: () => /^#[0-9a-f]{6}$/i.test(selected().styles[key] ?? "") ? selected().styles[key] : fallback, onChange: (event) => setStyle(key, event.currentTarget.value) }));
  }
  function Group(title: string, ...children: NodeModLike[]) { return div(s.group, h3(s.heading, title), ...children); }
  function Panel() {
    return aside(s.panel, { "aria-label": "Block properties" },
      Group("Block properties",
        label(s.field, span("Block name"), input({ value: () => selected().name, onChange: (event) => commit(() => { selected().name = event.currentTarget.value.trim() || kinds.find((entry) => entry.kind === selected().kind)!.label; }) })),
        p(s.hint, () => selected() === root ? "The page holds all your blocks. Add a layout to group them." : `${kinds.find((entry) => entry.kind === selected().kind)!.label} · select any block on the canvas to edit it.`),
        div(s.actions,
          action("Select parent", () => { const owner = parent(); if (owner) pick(owner); }),
          button(s.btn, { disabled: () => selected() === root, onClick: copy }, "Duplicate"),
          button(s.btn, { disabled: () => selected() === root, onClick: remove }, "Delete"),
          button(s.btn, { disabled: () => siblings().indexOf(selected()) <= 0, onClick: () => reorder(-1) }, "Move up"),
          button(s.btn, { disabled: () => selected() === root || siblings().indexOf(selected()) === siblings().length - 1, onClick: () => reorder(1) }, "Move down")),
        when(() => selected() !== root, label(s.field, { style: { marginTop: "12px" } }, span("Move into layout"), select({ "aria-label": "Move into layout", value: () => parent()?.id ?? "", onChange: (event) => { const target = flatten(root).find((block) => block.id === event.currentTarget.value); if (target) commit(() => { moveTo(root, selected(), target); }); } }, list(() => flatten(root).filter((block) => block.kind === "section" && !flatten(selected()).includes(block)), (block) => option({ value: block.id }, () => block.name))))),
      ),
      when(() => !["section", "divider"].includes(selected().kind), Group("Content", label(s.field,
        span(() => selected().kind === "image" ? "Image URL (https://…)" : "Text"),
        textarea({ value: () => selected().content, onInput: (event) => commit(() => { selected().content = event.currentTarget.value; }, `${selectedId}:content`), onChange: (event) => commit(() => { selected().content = event.currentTarget.value; }) })),
        when(() => selected().kind === "image", p(s.hint, "Use a public image URL. The block name is also its image description.")))),
      when(() => selected().kind === "section", Group("Layout", div(s.segmented,
        ...([ ["stack", "Stack"], ["row", "Row"], ["grid", "Grid"] ] as const).map(([mode, title]) => button(() => cx(s.btn, (mode === "grid" ? selected().styles.display === "grid" : selected().styles.display === "flex" && (mode === "row" ? selected().styles.flexDirection === "row" : selected().styles.flexDirection !== "row")) && s.active), { onClick: () => layout(mode) }, title))),
        p(s.hint, "Stack places blocks top to bottom. Row sits them side by side. Grid makes equal columns."),
        div(s.fields, Field("Gap", "gap", "16px"),
          label(s.field, span("Grid columns"), select({ "aria-label": "Grid columns", value: () => selected().styles.gridTemplateColumns?.match(/repeat\((\d)/)?.[1] ?? "2", disabled: () => selected().styles.display !== "grid", onChange: (event) => setStyle("gridTemplateColumns", `repeat(${event.currentTarget.value}, minmax(0, 1fr))`) }, ...[1, 2, 3, 4].map((n) => option({ value: String(n) }, String(n))))),
          Choice("Align items", "alignItems", [["stretch", "Stretch"], ["flex-start", "Start"], ["center", "Center"], ["flex-end", "End"]]),
          Choice("Distribute", "justifyContent", [["flex-start", "Start"], ["center", "Center"], ["flex-end", "End"], ["space-between", "Space between"], ["space-around", "Space around"]]),
          Choice("Wrap", "flexWrap", [["nowrap", "No wrap"], ["wrap", "Wrap"]]), Field("Custom columns", "gridTemplateColumns", "1fr 2fr", true)))),
      Group("Size & spacing", div(s.fields, Field("Width", "width", "auto / 100%"), Field("Height", "height", "auto"), Field("Min height", "minHeight", "0px"), Field("Max width", "maxWidth", "none"), Field("Padding", "padding", "16px"), Field("Margin", "margin", "0px"), Field("Grow in row", "flexGrow", "0"), Field("Grid span", "gridColumn", "span 2")), p(s.hint, "Use px, %, rem or auto. Spacing accepts four sides, like 12px 24px.")),
      Group("Appearance", div(s.fields, Color("Background", "backgroundColor", "#ffffff"), Color("Text color", "color", "#253c32"), Field("Corners", "borderRadius", "8px"), Field("Opacity", "opacity", "1"), Field("Border", "border", "1px solid #d9dfda", true), Field("Shadow", "boxShadow", "0 4px 16px #00000012", true), Choice("Overflow", "overflow", [["visible", "Visible"], ["hidden", "Hidden"], ["auto", "Scroll"]]), Choice("Image fit", "objectFit", [["cover", "Cover"], ["contain", "Contain"]]))),
      Group("Typography", div(s.fields, Field("Font size", "fontSize", "16px"), Choice("Weight", "fontWeight", [["400", "Regular"], ["500", "Medium"], ["600", "Semibold"], ["700", "Bold"]]), Field("Line height", "lineHeight", "1.5"), Field("Letter spacing", "letterSpacing", "0px"), Choice("Text align", "textAlign", [["left", "Left"], ["center", "Center"], ["right", "Right"]]), Choice("Font", "fontFamily", [["system-ui, sans-serif", "Sans serif"], ["Georgia, serif", "Serif"], ["ui-monospace, monospace", "Monospace"]]), Choice("Text style", "fontStyle", [["normal", "Normal"], ["italic", "Italic"]]), Choice("Decoration", "textDecoration", [["none", "None"], ["underline", "Underline"]]))),
      Group("More styling", p(s.hint, "Need a specific detail? Add any CSS property, such as aspect-ratio or background-image. Clear its value to remove it."),
        div(s.fields,
          label(s.field, span("CSS property"), input({ placeholder: "aspect-ratio", onInput: (event) => { cssProperty = event.currentTarget.value; } })),
          label(s.field, span("CSS value"), input({ placeholder: "16 / 9", onInput: (event) => { cssValue = event.currentTarget.value; } }))),
        action("Apply style", () => {
          const property = cssProperty.trim();
          if (!/^[a-z][a-z-]*$/.test(property) || (cssValue.trim() && !CSS.supports(property, cssValue.trim()))) {
            status = "Check the CSS property and value, then try again.";
            update();
            return;
          }
          setStyle(property.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase()), cssValue);
        })),
    );
  }
  return div(s.app,
    on("mount", (element) => {
      appElement = element;
      const outside = (event: PointerEvent) => { suppressClick = false; if (popup && !(event.target as Element).closest("[data-pb-menu]")) closePopup(false); };
      const dismiss = () => { if (popup) closePopup(false); };
      const scroll = (event: Event) => { if (popup && !(event.target instanceof Element && event.target.closest("[data-pb-menu]"))) dismiss(); };
      const preventClick = (event: MouseEvent) => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } };
      const escapeDrag = (event: KeyboardEvent) => { if (drag && event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancelDrag(); } };
      document.addEventListener("pointerdown", outside, true);
      document.addEventListener("pointermove", dragMove, { passive: false });
      document.addEventListener("pointerup", endDrag);
      document.addEventListener("pointercancel", cancelDrag);
      document.addEventListener("click", preventClick, true);
      document.addEventListener("keydown", escapeDrag, true);
      document.addEventListener("wheel", scroll, true);
      document.addEventListener("touchmove", scroll, true);
      window.addEventListener("resize", dismiss);
      return () => { cancelAnimationFrame(dragFrame); if (drag?.source.hasPointerCapture(drag.pointerId)) drag.source.releasePointerCapture(drag.pointerId); drag = null; dropTarget = null; document.removeEventListener("pointermove", dragMove); document.removeEventListener("pointerup", endDrag); document.removeEventListener("pointercancel", cancelDrag); document.removeEventListener("click", preventClick, true); document.removeEventListener("keydown", escapeDrag, true); document.removeEventListener("pointerdown", outside, true); document.removeEventListener("wheel", scroll, true); document.removeEventListener("touchmove", scroll, true); window.removeEventListener("resize", dismiss); editors.clear(); appElement = undefined; };
    }),
    { "data-page-builder": "", onKeyDown: (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") event.stopPropagation();
    if (preview || event.defaultPrevented || event.isComposing || (event.target as HTMLElement).closest("input,textarea,select,[data-pb-menu]")) return;
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "z") { event.preventDefault(); travel(event.shiftKey ? 1 : -1); }
    else if (modifier && event.key.toLowerCase() === "d") { event.preventDefault(); copy(); }
    else if ((event.target as HTMLElement).closest("[contenteditable=plaintext-only]")) return;
    else if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); remove(); }
    else if (event.key === "/") { event.preventDefault(); openPopup("blocks", selected()); }
  } },
    div(s.bar, div(s.brand, Icon("section"), strong("Page studio")),
      button(s.btn, { "aria-label": "Undo", title: "Undo (Ctrl+Z)", disabled: () => cursor === 0, onClick: () => travel(-1) }, Icon("undo")),
      button(s.btn, { "aria-label": "Redo", title: "Redo (Ctrl+Shift+Z)", disabled: () => cursor === snapshots.length - 1, onClick: () => travel(1) }, Icon("redo")),
      button(() => cx(s.btn, adding && s.active), { disabled: () => preview, "aria-expanded": () => String(adding), onClick: () => { popup = null; adding = !adding; update(); } }, Icon("plus"), "Add block"),
      button(() => cx(s.btn, preview && s.active), { "aria-pressed": () => String(preview), onClick: () => { preview = !preview; adding = false; popup = null; update(); } }, () => preview ? "Back to editing" : "Preview"),
      button(s.btn, s.primary, { onClick: download }, "Export HTML")),
    when(() => adding, div(s.picker, div(s.canvasBar, strong(() => selected().kind === "section" ? `Add inside ${selected().name}` : `Add after ${selected().name}`), action("Close", () => { adding = false; update(); })), div(s.choices, ...kinds.map((entry) => button(s.choice, { onClick: () => add(entry.kind) }, Icon(entry.kind), strong(entry.label), small(entry.hint)))))),
    div(() => cx(s.workspace, preview && s.previewWorkspace),
      when(() => !preview, aside(s.outline, { "aria-label": "Page outline" }, h3(s.heading, "Page outline"), list(() => [root], (block) => Layer(block)), p(s.hint, "Drag a grip to reorder or move into a layout. Click text to write; / adds blocks."))),
      section(s.stage, { "aria-label": "Design canvas" },
        div(s.canvasBar, span(() => preview ? "Preview · your finished page" : "Drag grips to move · click to type · / to add"), div(s.segmented,
          button(() => cx(s.btn, !phone && s.active), { "aria-pressed": () => String(!phone), onClick: () => { phone = false; update(); } }, "Desktop"),
          button(() => cx(s.btn, phone && s.active), { "aria-pressed": () => String(phone), onClick: () => { phone = true; update(); } }, "Phone"))),
        div(() => cx(s.canvas, preview && s.clean, phone && s.narrow), list(() => [root], RenderBlock))),
      when(() => !preview, Panel())),
    when(() => popup !== null, Popup()),
    when(() => drag?.active === true, div(s.dragPreview, { "data-pb-drag-preview": "", "aria-hidden": "true", style: () => ({ left: `${Math.min((drag?.x ?? 0) + 16, window.innerWidth - 240)}px`, top: `${Math.min((drag?.y ?? 0) + 16, window.innerHeight - 54)}px` }) }, Icon("grip"), strong(() => drag?.block.name ?? ""), span(() => dropTarget ? `${dropTarget.position === "inside" ? "Into" : dropTarget.position === "before" ? "Before" : "After"} ${dropTarget.block.name}` : "Choose a drop position"))),
    div(s.footer, span({ role: "status", "aria-live": "polite" }, () => status), span(() => `${flatten(root).length - 1} blocks · ${preview ? "Preview mode" : "Editing mode"}`)),
  );
}
