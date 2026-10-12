// app.ts: the inspector. There is no state of its own: every value on screen
// is read from the three.js object it belongs to, and every control writes
// to that object. The render loop calls update() once per frame, after
// three.js has moved things, and that is the only update() in this file.
import "nuclo";
import type * as THREE from "three";
import { createWorld, type World } from "./scene.ts";
import { s } from "./styles.ts";

let world: World | null = null;
let selected: THREE.Mesh | null = null;
let status = "Loading three.js…";

const meshes = () => world?.meshes() ?? [];
const material = (m: THREE.Mesh) => m.material as THREE.MeshStandardMaterial;
const hex = (m: THREE.Mesh) => `#${material(m).color.getHexString()}`;

function Stage() {
  return div(
    s.stage,
    canvas(
      s.canvas,
      on("mount", (el) => {
        let stop = () => {};
        createWorld(el).then((w) => {
          if (!el.isConnected) return w.dispose(); // closed before three.js arrived
          world = w;
          const box = el.parentElement!;
          const sizes = new ResizeObserver(() => w.resize(box.clientWidth, box.clientHeight));
          sizes.observe(box);
          const stopLoop = w.start(update); // every frame: sync the panel with the scene
          stop = () => { stopLoop(); sizes.disconnect(); w.dispose(); world = selected = null; };
        }).catch((err: Error) => { status = `three.js did not load: ${err.message}`; update(); });
        return () => stop();
      }),
      { onPointerDown: (e) => { selected = world?.pick(e.offsetX, e.offsetY) ?? null; } },
    ),
    when(() => world === null, p(s.loading, () => status)),
  );
}

function Row(mesh: THREE.Mesh) {
  return li(
    s.row,
    { class: () => cx(s.row, mesh === selected ? s.selected : null).className, onClick: () => { selected = mesh; } },
    span(s.swatch, { style: () => ({ backgroundColor: hex(mesh) }) }),
    span(s.name, mesh.name),
    span(s.coords, () => (mesh.visible ? `y ${mesh.position.y.toFixed(2)}  rot ${(mesh.rotation.y % 6.28).toFixed(2)}` : "hidden")),
  );
}

// Only on screen while something is selected, so `selected!` is safe here.
function Inspector() {
  const sel = () => selected!;
  return div(
    s.props,
    h4(s.propsTitle, () => sel().name),
    label(s.field, span("Color"), input({ type: "color", value: () => hex(sel()) }, { onInput: (e) => { material(sel()).color.set(e.currentTarget.value); } })),
    label(s.field, span("Scale"), input({ type: "range", min: "0.3", max: "2.5", step: "0.05", value: () => String(sel().scale.x) }, { onInput: (e) => { sel().scale.setScalar(Number(e.currentTarget.value)); } })),
    label(s.field, span("Spin"), input({ type: "range", min: "-3", max: "3", step: "0.1", value: () => String(sel().userData.spin) }, { onInput: (e) => { sel().userData.spin = Number(e.currentTarget.value); } })),
    label(s.check, input({ type: "checkbox", checked: () => sel().visible }, { onChange: () => { sel().visible = !sel().visible; } }), "Visible"),
    label(s.check, input({ type: "checkbox", checked: () => material(sel()).wireframe }, { onChange: () => { material(sel()).wireframe = !material(sel()).wireframe; } }), "Wireframe"),
    button(s.btn, "Remove", { onClick: () => { world?.remove(sel()); selected = null; } }),
  );
}

export function ThreeInspector() {
  return div(
    s.app,
    Stage(),
    aside(
      s.panel,
      div(s.panelHead, strong("Scene"), span(s.stats, () => `${meshes().length} objects · ${world?.fps ?? 0} fps · ${world?.renderer.info.render.triangles ?? 0} triangles`)),
      ul(s.list, list(meshes, Row)),
      when(() => selected !== null, Inspector()).else(p(s.hint, "Click an object, in the scene or in the list.")),
      button(s.btn, s.primary, "Add object", { onClick: () => { world?.add(); } }),
    ),
  );
}
