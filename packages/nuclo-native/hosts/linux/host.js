// nuclo-native host for Linux: GTK 4 + libadwaita widgets driven from GJS.
// Run: gjs -m hosts/linux/host.js dist/app.js
import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";
import Gdk from "gi://Gdk?version=4.0";
import Gsk from "gi://Gsk";
import Graphene from "gi://Graphene";
import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import { programArgs } from "system";

const { HORIZONTAL, VERTICAL } = Gtk.Orientation;
const ALIGN = { "flex-start": Gtk.Align.START, center: Gtk.Align.CENTER, "flex-end": Gtk.Align.END, stretch: Gtk.Align.FILL };
const CSS = new Set("color backgroundColor fontSize fontWeight fontFamily padding margin border borderRadius opacity".split(" "));
const CSS_ALIAS = { width: "min-width", height: "min-height" };
const UNITLESS = new Set(["fontWeight", "opacity"]);
// The router's tab icon names → Adwaita symbolic icons.
const ICONS = { chart: "x-office-presentation-symbolic", photo: "image-x-generic-symbolic", person: "avatar-default-symbolic" };

const bundle = programArgs[0] ?? "dist/app.js";
const widgets = new Map();
/** Stacks whose screens changed in the current batch. */
const dirty = new Set();
/** Every screen's background: the body's backgroundColor. */
const screenCss = new Gtk.CssProvider();
/** True while a batch is applied: navigation changes then are the app's, not the user's. */
let applying = false;
let window;

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

  // One page per stack, switched from a bottom bar.
  tabs: () => {
    const views = new Adw.ViewStack();
    const tabs = new Adw.ToolbarView({ content: views });
    tabs.add_bottom_bar(new Adw.ViewSwitcherBar({ stack: views, reveal: true }));
    tabs._views = views;
    tabs._tabs = [];
    views.connect("notify::visible-child", () => {
      if (!applying) emit(tabs._id, "select", tabs._tabs.indexOf(views.visible_child));
    });
    return tabs;
  },

  // Push/pop transitions, back button, swipe back, Alt+Left and mouse back are built in.
  stack: () => {
    const nav = new Adw.NavigationView();
    nav._pages = []; // the app's screens, bottom to top
    nav.connect("popped", () => {
      if (applying) return;
      // The user went back: the screens JS removes next are already gone.
      nav._pages = pagesOf(nav);
      emit(nav._id, "pop", nav._pages.length);
    });
    return nav;
  },

  screen: () => {
    const box = new Gtk.Box({ orientation: VERTICAL });
    const scroll = new Gtk.ScrolledWindow({ child: box, css_classes: ["nuclo-screen"] });
    const content = new Adw.ToolbarView({ content: scroll });
    content.add_top_bar(new Adw.HeaderBar());
    const page = new Adw.NavigationPage({ child: content });
    page._box = box;
    return page;
  },
};

function pagesOf(nav) {
  const stack = nav.navigation_stack;
  return Array.from({ length: stack.get_n_items() }, (_, i) => stack.get_item(i));
}

const same = (a, b) => a.length === b.length && a.every((page, i) => page === b[i]);

// Shows a stack's screens: a new top is a push, a removed top a pop (both animated), anything else a replace.
function sync(nav) {
  const want = nav._pages;
  const shown = pagesOf(nav);
  const top = want.at(-1);
  if (same(want, shown)) return;
  if (shown.length && same(want.slice(0, -1), shown)) nav.push(top);
  else if (top && same(want, shown.slice(0, want.length))) nav.pop_to_page(top);
  else nav.replace(want);
}

function select(tabs) {
  const nav = tabs._tabs[tabs._selected ?? 0];
  if (nav) tabs._views.visible_child = nav;
}

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
    if (parent._pages) {
      // A screen onto a stack: only the model changes now, the batch's end shows it.
      const pages = parent._pages.filter((page) => page !== child);
      const at = beforeId ? pages.indexOf(widgets.get(beforeId)) : -1;
      pages.splice(at < 0 ? pages.length : at, 0, child);
      parent._pages = pages;
      child._nav = parent;
      dirty.add(parent);
    } else if (parent._tabs) {
      // ponytail: tabs only append; the router never reorders them, use beforeId if one does.
      child._tab = parent._views.add_titled_with_icon(child, null, child._title ?? "", child._icon ?? "");
      parent._tabs.push(child);
      select(parent);
    } else if (parentId === 1 && (child._pages || child._tabs)) {
      window.content = child;
    } else {
      const box = parent._box ?? parent;
      child.get_parent()?.remove(child);
      const after = beforeId ? widgets.get(beforeId).get_prev_sibling() : box.get_last_child();
      box.insert_child_after(child, after);
      place(box, child);
    }
  },

  remove(id) {
    const widget = widgets.get(id);
    if (widget._nav) {
      // A no-op when the user already went back natively.
      widget._nav._pages = widget._nav._pages.filter((page) => page !== widget);
      dirty.add(widget._nav);
    } else widget.get_parent()?.remove(widget);
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
    else if (key === "title" && widget instanceof Adw.NavigationPage) widget.title = value ?? "";
    else if (key === "title" || key === "icon") {
      // A stack's tab.
      widget["_" + key] = key === "icon" ? (ICONS[value] ?? value) : value;
      if (widget._tab) Object.assign(widget._tab, { title: widget._title ?? "", icon_name: widget._icon ?? "" });
    } else if (key === "selected" && widget._tabs) {
      widget._selected = Number(value);
      select(widget);
    } else if (key === "src") {
      // Asset paths are relative to the bundle.
      widget._texture = Gdk.Texture.new_from_filename(GLib.build_filenamev([GLib.path_get_dirname(bundle), value]));
      widget.queue_draw();
    }
  },

  style(id, key, value) {
    const widget = widgets.get(id);
    const box = widget instanceof Gtk.Box;
    if (id === 1 && key === "backgroundColor") screenCss.load_from_string(`.nuclo-screen{background-color:${value};}`);
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

/** Device data JS watches (src/device.ts): name → its last JSON, "" when the device has none. */
const devices = new Map();

globalThis.__nuclo_device = (name) => {
  if (!devices.has(name)) {
    devices.set(name, "");
    try {
      if (name === "battery") watchBattery();
    } catch {
      // No system bus (macOS) or no UPower: no battery.
    }
  }
  return devices.get(name);
};

function changed(name, json) {
  if (devices.get(name) === json) return;
  devices.set(name, json);
  globalThis.__nuclo_device_changed(name, json);
}

// UPower's display device: the battery the desktop's panel shows. Module-level so GC never drops the proxy (and its signal).
let upower;
function watchBattery() {
  upower = Gio.DBusProxy.new_for_bus_sync(Gio.BusType.SYSTEM, Gio.DBusProxyFlags.NONE, null,
    "org.freedesktop.UPower", "/org/freedesktop/UPower/devices/DisplayDevice", "org.freedesktop.UPower.Device", null);
  const read = () => {
    const get = (key) => upower.get_cached_property(key)?.unpack();
    if (!get("IsPresent")) return "";
    const percent = get("Percentage");
    // 3 empty counts as discharging; 5/6 pending charge/discharge (plugged in, idle) as unknown.
    const state = { 1: "charging", 2: "discharging", 3: "discharging", 4: "full" }[get("State")] ?? "unknown";
    const seconds = { charging: get("TimeToFull"), discharging: get("TimeToEmpty") }[state]; // 0: unknown
    return JSON.stringify({ level: percent == null ? null : percent / 100, state, minutes: seconds ? Math.round(seconds / 60) : null });
  };
  devices.set("battery", read());
  upower.connect("g-properties-changed", () => changed("battery", read()));
}

const app = new Adw.Application({ application_id: "dev.nuclo.native" });
app.connect("activate", () => {
  const root = create.view();
  widgets.set(1, root);
  // A tabs or stack inserted into the body replaces this content.
  const content = new Adw.ToolbarView({ content: new Gtk.ScrolledWindow({ child: root }) });
  content.add_top_bar(new Adw.HeaderBar());
  window = new Adw.ApplicationWindow({ application: app, title: "nuclo-native", default_width: 420, default_height: 640, content });
  Gtk.StyleContext.add_provider_for_display(window.get_display(), screenCss, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

  globalThis.__nuclo_host = (json) => {
    const outer = applying;
    applying = true;
    try {
      for (const [op, ...args] of JSON.parse(json)) apply[op](...args);
      for (const nav of dirty) sync(nav);
    } finally {
      dirty.clear();
      applying = outer;
    }
  };
  const [, bytes] = GLib.file_get_contents(bundle);
  (0, eval)(new TextDecoder().decode(bytes));
  window.present();
});
app.run([]);
