// nuclo-native host for Linux: GTK 4 widgets driven from GJS.
// Run: gjs -m hosts/linux/host.js dist/app.js
import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import Gsk from "gi://Gsk";
import Graphene from "gi://Graphene";
import GObject from "gi://GObject";
import GLib from "gi://GLib";
import { programArgs } from "system";

const { HORIZONTAL, VERTICAL } = Gtk.Orientation;
const ALIGN = { "flex-start": Gtk.Align.START, center: Gtk.Align.CENTER, "flex-end": Gtk.Align.END, stretch: Gtk.Align.FILL };
const CSS = new Set("color backgroundColor fontSize fontWeight fontFamily padding margin border borderRadius opacity".split(" "));
const CSS_ALIAS = { width: "min-width", height: "min-height" };
const UNITLESS = new Set(["fontWeight", "opacity"]);

const bundle = programArgs[0] ?? "dist/app.js";
const widgets = new Map();

/** An image that fills whatever box it is given (cover), cropped and rounded. */
const Image = GObject.registerClass(
  class NucloImage extends Gtk.Widget {
    vfunc_measure(orientation) {
      const size = (orientation === HORIZONTAL ? this._width : this._height) ?? 0;
      return [size, size, -1, -1];
    }

    vfunc_snapshot(snapshot) {
      const texture = this._texture;
      if (!texture) return;
      const width = this.get_width();
      const height = this.get_height();
      const scale = Math.max(width / texture.width, height / texture.height);
      const w = texture.width * scale;
      const h = texture.height * scale;
      const frame = new Graphene.Rect().init(0, 0, width, height);
      snapshot.push_rounded_clip(new Gsk.RoundedRect().init_from_rect(frame, this._radius ?? 0));
      snapshot.append_texture(texture, new Graphene.Rect().init((width - w) / 2, (height - h) / 2, w, h));
      snapshot.pop();
    }
  },
);
const emit = (id, type, value) => globalThis.__nuclo_event(id, type, value);

const create = {
  view: () => new Gtk.Box({ orientation: VERTICAL }),
  text: () => new Gtk.Label({ xalign: 0, wrap: true }),
  button: () => new Gtk.Button(),
  input: () => new Gtk.Entry(),
  checkbox: () => new Gtk.CheckButton(),
  image: () => new Image(),
};

// A child's flex and its parent's alignItems depend on the parent's direction.
function place(parent, child) {
  const row = parent.orientation === HORIZONTAL;
  const grow = child._flex > 0;
  child.hexpand = grow && row;
  child.vexpand = grow && !row;
  const cross = parent._alignItems ?? Gtk.Align.FILL;
  child.halign = row ? Gtk.Align.FILL : cross;
  child.valign = row ? cross : Gtk.Align.FILL;
}

function relayout(box) {
  for (let c = box.get_first_child(); c; c = c.get_next_sibling()) place(box, c);
}

function forget(widget) {
  for (let c = widget.get_first_child(); c; c = c.get_next_sibling()) forget(c);
  widgets.delete(widget._id);
}

const apply = {
  create(id, kind) {
    const widget = create[kind]();
    widget._id = id;
    widgets.set(id, widget);
  },

  insert(parentId, id, beforeId) {
    const parent = widgets.get(parentId);
    const child = widgets.get(id);
    child.get_parent()?.remove(child);
    const after = beforeId ? widgets.get(beforeId).get_prev_sibling() : parent.get_last_child();
    parent.insert_child_after(child, after);
    place(parent, child);
  },

  remove(id) {
    const widget = widgets.get(id);
    widget.get_parent()?.remove(widget);
    forget(widget);
  },

  set(id, key, value) {
    const widget = widgets.get(id);
    if (key === "text") {
      if (widget instanceof Gtk.Label || widget instanceof Gtk.Button) widget.label = value;
    } else if (key === "value") {
      if (widget.text !== value) widget.text = value ?? "";
    } else if (key === "checked") widget.active = !!value;
    else if (key === "placeholder") widget.placeholder_text = value;
    else if (key === "type") widget.visibility = value !== "password";
    else if (key === "disabled") widget.sensitive = !value;
    else if (key === "src") {
      // Asset paths are relative to the bundle.
      widget._texture = Gdk.Texture.new_from_filename(GLib.build_filenamev([GLib.path_get_dirname(bundle), value]));
      widget.queue_draw();
    }
  },

  style(id, key, value) {
    const widget = widgets.get(id);
    const box = widget instanceof Gtk.Box;
    if (widget instanceof Image) {
      if (key === "width" || key === "height" || key === "borderRadius") widget["_" + key.replace("borderR", "r")] = parseFloat(value);
      widget.queue_resize();
    }
    if (key === "flexDirection" && box) {
      widget.orientation = value === "row" ? HORIZONTAL : VERTICAL;
      relayout(widget);
    } else if (key === "gap" && box) widget.spacing = parseFloat(value);
    else if (key === "alignItems" && box) {
      widget._alignItems = ALIGN[value];
      relayout(widget);
    } else if (key === "flex") {
      widget._flex = parseFloat(value);
      const parent = widget.get_parent();
      if (parent instanceof Gtk.Box) place(parent, widget);
    } else if (key === "textAlign" && widget instanceof Gtk.Label) {
      widget.xalign = { center: 0.5, right: 1 }[value] ?? 0;
    } else if (CSS.has(key) || key in CSS_ALIAS) {
      const name = CSS_ALIAS[key] ?? key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
      const css = (widget._css ??= {});
      css[name] = !UNITLESS.has(key) && /^-?[\d.]+$/.test(value) ? value + "px" : value;
      if (!widget._provider) {
        widget._provider = new Gtk.CssProvider();
        widget.get_style_context().add_provider(widget._provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
      }
      const rules = Object.entries(css).map(([k, v]) => `${k}:${v};`).join("");
      widget._provider.load_from_string(`* {${rules}}`);
    }
  },

  listen(id, type) {
    const widget = widgets.get(id);
    if (type === "input") widget.connect("changed", () => emit(id, type, widget.text));
    else if (type === "change") {
      if (widget instanceof Gtk.CheckButton) widget.connect("toggled", () => emit(id, type, widget.active));
      else widget.connect("activate", () => emit(id, type));
    }
    else if (type === "click") {
      if (widget instanceof Gtk.Button) widget.connect("clicked", () => emit(id, type));
      else {
        const gesture = new Gtk.GestureClick();
        gesture.connect("released", () => emit(id, type));
        widget.add_controller(gesture);
      }
    }
  },
};

const app = new Gtk.Application({ application_id: "dev.nuclo.native" });
app.connect("activate", () => {
  const root = create.view();
  widgets.set(1, root);
  const window = new Gtk.ApplicationWindow({ application: app, title: "nuclo-native", default_width: 420, default_height: 640 });
  window.child = new Gtk.ScrolledWindow({ child: root });

  globalThis.__nuclo_host = (json) => {
    for (const [op, ...args] of JSON.parse(json)) apply[op](...args);
  };
  const [, bytes] = GLib.file_get_contents(bundle);
  (0, eval)(new TextDecoder().decode(bytes));
  window.present();
});
app.run([]);
