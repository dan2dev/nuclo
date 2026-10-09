/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { forceUpdate, hydrate, render } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr/render-to-string";
import { withServerGlobals } from "../integration/fuzz-harness";
import "../../src";

const inputValues = [
  ["text", "draft 👋"], ["search", "query"], ["tel", "+55 123"],
  ["url", "https://example.com/"], ["email", "a@example.com"], ["password", "secret"],
  ["number", "-2.5"], ["range", "73"], ["date", "2026-10-09"],
  ["datetime-local", "2026-10-09T12:34"], ["month", "2026-10"],
  ["week", "2026-W41"], ["time", "12:34"], ["color", "#123456"],
  ["hidden", "token"], ["checkbox", "yes"], ["radio", "choice"],
  ["file", ""], ["button", "Push"], ["submit", "Send"],
  ["reset", "Reset"], ["image", "Image"],
] as const;

describe("forceUpdate with region/into forms", () => {
  let root: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    update();
    root = document.createElement("div");
    document.body.append(root);
  });

  afterEach(() => {
    root.remove();
    update();
    forceUpdate();
  });

  for (const mode of ["latest", "stack"] as const) {
    for (const refresh of ["registered", "explicit", "hydrated"] as const) {
      describe(`${mode}, ${refresh}`, () => {
        it.each(inputValues)("preserves an uncontrolled %s input", (type, value) => {
          let caption = "Before";
          const App = () => div(
            region({ id: "forms", type: mode }),
            into("forms", form(label(caption, input({ type, name: "field" })))),
          );
          if (refresh === "hydrated") {
            root.innerHTML = withServerGlobals(() => renderToString(App));
          } else {
            render(refresh === "explicit" ? App() : App, root);
          }
          const field = root.querySelector("input")!;
          const owner = field.form;
          const files = field.files;
          field.value = value;
          if (type === "checkbox" || type === "radio") field.checked = true;
          if (type === "checkbox") field.indeterminate = true;
          field.setCustomValidity("keep this error");
          if (refresh === "hydrated") hydrate(App, root);

          for (let pass = 0; pass < 3; pass++) {
            caption = `After ${pass}`;
            if (refresh === "explicit") forceUpdate(App(), root);
            else forceUpdate();
            expect(root.querySelector("input")).toBe(field);
            expect(field.form).toBe(owner);
            expect(field.value).toBe(value);
            expect(field.validity.customError).toBe(true);
            expect(root.querySelector("label")!.textContent).toBe(caption);
            if (type === "checkbox" || type === "radio") expect(field.checked).toBe(true);
            if (type === "checkbox") expect(field.indeterminate).toBe(true);
            if (type === "file") expect(field.files).toBe(files);
          }
          expect(console.error).not.toHaveBeenCalled();
        });
      });
    }

    it.each(["input", "textarea"] as const)(`${mode}: preserves %s focus, selection and scroll`, (kind) => {
      let caption = "Before";
      render(() => div(
        region({ id: "forms", type: mode }),
        into("forms", form(label(caption, kind === "input" ? input() : textarea()))),
      ), root);
      const field = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(kind)!;
      field.value = "first line\nsecond line";
      const value = field.value;
      field.focus();
      field.setSelectionRange(2, 7, "backward");
      field.scrollTop = 15;
      field.scrollLeft = 10;
      caption = "After";
      forceUpdate();
      forceUpdate();
      expect(root.querySelector(kind)).toBe(field);
      expect(document.activeElement).toBe(field);
      expect(field.value).toBe(value);
      expect([field.selectionStart, field.selectionEnd, field.selectionDirection]).toEqual([2, 7, "backward"]);
      expect([field.scrollTop, field.scrollLeft]).toEqual([15, 10]);
      expect(root.querySelector("label")!.textContent).toBe("After");
    });

    it.each([false, true])(`${mode}: preserves uncontrolled select selections (multiple=%s)`, (multiple) => {
      let caption = "Before";
      render(() => div(
        region({ id: "forms", type: mode }),
        into("forms", form(select({ multiple, name: "pick" },
          optgroup({ label: caption }, option({ value: "a" }, "A"), option({ value: "b" }, "B")),
          option({ value: "c" }, "C"),
        ))),
      ), root);
      const field = root.querySelector("select")!;
      const options = Array.from(field.options);
      field.value = "b";
      if (multiple) field.options[2]!.selected = true;
      caption = "After";
      forceUpdate();
      expect(root.querySelector("select")).toBe(field);
      options.forEach((item, i) => expect(field.options[i]).toBe(item));
      expect(Array.from(field.selectedOptions, o => o.value)).toEqual(multiple ? ["b", "c"] : ["b"]);
      expect(root.querySelector("optgroup")!.label).toBe("After");
      field.selectedIndex = -1;
      forceUpdate();
      expect(field.selectedIndex).toBe(-1);
    });

    it(`${mode}: rebinds controlled values and handlers without accumulating listeners`, () => {
      let state = { text: "initial", checked: true, pick: "a", selected: ["a"] };
      const events: string[] = [];
      const App = () => {
        const current = state;
        return div(region({ id: "forms", type: mode }), into("forms", form(
          input({ value: () => current.text, onInput: e => { events.push("input"); current.text = e.currentTarget.value; } }),
          textarea({ value: () => current.text }),
          input({ type: "checkbox", checked: () => current.checked, onChange: e => { events.push("change"); current.checked = e.currentTarget.checked; } }),
          select({ value: () => current.pick }, option({ value: "a" }, "A"), option({ value: "b" }, "B")),
          select({ multiple: true }, ...["a", "b"].map(value => option({ value, selected: () => current.selected.includes(value) }, value))),
        )));
      };
      render(App, root);
      const controls = Array.from(root.querySelectorAll("input, textarea, select"));
      const old = state;
      state = { text: "", checked: false, pick: "b", selected: ["b"] };
      for (let pass = 0; pass < 3; pass++) forceUpdate();
      controls.forEach((control, i) => expect(root.querySelectorAll("input, textarea, select")[i]).toBe(control));
      const text = root.querySelector("input")!;
      const box = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
      expect(text.value).toBe("");
      expect(root.querySelector("textarea")!.value).toBe("");
      expect(box.checked).toBe(false);
      expect(root.querySelector("select")!.value).toBe("b");
      expect(Array.from(root.querySelector<HTMLSelectElement>("select[multiple]")!.selectedOptions, o => o.value)).toEqual(["b"]);
      text.value = "edited";
      text.dispatchEvent(new Event("input", { bubbles: true }));
      box.click();
      update();
      expect(events).toEqual(["input", "change"]);
      expect(state.text).toBe("edited");
      expect(state.checked).toBe(true);
      expect(old).toEqual({ text: "initial", checked: true, pick: "a", selected: ["a"] });
      expect(root.querySelector("textarea")!.value).toBe("edited");
    });
  }

  it.each(inputValues.filter(([type]) => type !== "file"))("reapplies static %s values, then releases control", (type, value) => {
    let controlled = true;
    const current = value;
    const App = () => div(region({ id: "forms" }), into("forms", form(
      input({ type, ...(controlled ? { value: current } : {}) }),
    )));
    render(App, root);
    const field = root.querySelector("input")!;
    field.value = "";
    forceUpdate();
    expect(field.value).toBe(value);
    controlled = false;
    forceUpdate();
    field.value = "";
    const empty = field.value; // Color/range use their native default instead of an empty string.
    forceUpdate();
    expect(root.querySelector("input")).toBe(field);
    expect(field.value).toBe(empty);
  });

  it("keeps independent radio groups and submitted values in stacked forms", () => {
    render(() => div(region({ id: "forms", type: "stack" }), ...["a", "b"].map(id => into("forms",
      form({ id },
        input({ type: "radio", name: "plan", value: "free" }),
        input({ type: "radio", name: "plan", value: "pro" }),
      ),
    ))), root);
    const forms = Array.from(root.querySelectorAll("form"));
    forms[0]!.querySelectorAll("input")[1]!.click();
    forms[1]!.querySelectorAll("input")[0]!.click();
    forceUpdate();
    forceUpdate();
    expect(new FormData(forms[0]!).getAll("plan")).toEqual(["pro"]);
    expect(new FormData(forms[1]!).getAll("plan")).toEqual(["free"]);
    expect(Array.from(root.querySelectorAll("form"))).toEqual(forms);
  });

  it.each(["latest", "stack"] as const)("restores a covered %s form according to its lifetime", (type) => {
    let cover = false;
    const mount = vi.fn();
    const destroy = vi.fn();
    render(() => div(
      region({ id: "forms", type }),
      into("forms", form({ id: "draft", onMount: mount, onDestroy: destroy }, textarea({ defaultValue: "initial" }))),
      when(() => cover, into("forms", form({ id: "cover" }, input()))),
    ), root);
    const draft = root.querySelector("#draft")!;
    const field = root.querySelector("textarea")!;
    field.value = "unsent\nmessage";
    cover = true;
    update();
    expect(root.querySelector("#draft")).toBe(type === "latest" ? null : draft);
    forceUpdate();
    forceUpdate();
    cover = false;
    update();
    if (type === "stack") {
      expect(root.querySelector("#draft")).toBe(draft);
      expect(root.querySelector("textarea")).toBe(field);
      expect(field.value).toBe("unsent\nmessage");
    } else {
      expect(root.querySelector("#draft")).not.toBe(draft);
      expect(root.querySelector("textarea")!.value).toBe("initial");
    }
    expect(mount).toHaveBeenCalledTimes(type === "stack" ? 1 : 2);
    expect(destroy).toHaveBeenCalledTimes(type === "stack" ? 0 : 1);
  });

  it("reclaims nested region fields with the correct form owner and reset defaults", () => {
    let caption = "Before";
    render(() => div(
      region({ id: "forms" }),
      into("forms", form({ id: "owner" }, label(caption), region({ id: "fields" }))),
      into("fields", input({ name: "text", defaultValue: "default" }),
        textarea({ name: "notes", defaultValue: "notes" }),
        input({ type: "checkbox", name: "check", defaultChecked: true })),
    ), root);
    const owner = root.querySelector("form")!;
    const text = root.querySelector("input")!;
    const notes = root.querySelector("textarea")!;
    const box = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    text.value = "edited";
    notes.value = "edited notes";
    box.checked = false;
    caption = "After";
    forceUpdate();
    expect(root.querySelector("form")).toBe(owner);
    expect(Array.from(owner.elements)).toEqual([text, notes, box]);
    expect([text.form, notes.form, box.form]).toEqual([owner, owner, owner]);
    expect([text.value, notes.value, box.checked]).toEqual(["edited", "edited notes", false]);
    owner.reset();
    expect([text.value, notes.value, box.checked]).toEqual(["default", "notes", true]);
    expect(root.querySelector("label")!.textContent).toBe("After");
  });

  it("refreshes submit/reset handlers and successful controls without duplicate events", () => {
    let version = 0;
    let disabled = true;
    const events: string[] = [];
    const App = () => {
      const captured = version;
      return div(region({ id: "forms" }), into("forms", form({
        id: "owner",
        onSubmit: e => { e.preventDefault(); events.push(`submit-${captured}`); },
        onReset: () => { events.push(`reset-${captured}`); },
      },
      fieldset({ disabled }, legend("Details"), input({ name: "inside", defaultValue: "saved" })),
      input({ name: "readonly", readOnly: true, defaultValue: "included" }),
      input({ type: "hidden", name: "token", value: "secret" }),
      button({ type: "submit" }, "Send"), button({ type: "reset" }, "Reset"),
      )), input({ form: "owner", name: "outside", defaultValue: "external" }));
    };
    render(App, root);
    const owner = root.querySelector("form")!;
    expect(new FormData(owner).has("inside")).toBe(false);
    version = 1;
    disabled = false;
    forceUpdate();
    forceUpdate();
    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    root.querySelector<HTMLInputElement>('input[name="inside"]')!.value = "edited";
    root.querySelector<HTMLButtonElement>('button[type="reset"]')!.click();
    expect(events).toEqual(["submit-1", "reset-1"]);
    expect(Array.from(new FormData(owner).entries())).toEqual([
      ["inside", "saved"], ["readonly", "included"], ["token", "secret"], ["outside", "external"],
    ]);
  });

  it("places a waiting form using the latest build and keeps later edits", () => {
    let present = false;
    let initial = "before";
    const mounted = vi.fn();
    render(() => div(
      into("late", form({ onMount: mounted }, input({ defaultValue: initial }))),
      when(() => present, region({ id: "late" })),
    ), root);
    initial = "after";
    forceUpdate();
    forceUpdate();
    expect(root.querySelector("form")).toBeNull();
    expect(mounted).not.toHaveBeenCalled();
    present = true;
    forceUpdate();
    const field = root.querySelector("input")!;
    expect(field.value).toBe("after");
    field.value = "draft";
    forceUpdate();
    expect(root.querySelector("input")).toBe(field);
    expect(field.value).toBe("draft");
    expect(mounted).toHaveBeenCalledTimes(1);
  });

  it("retargets a form, destroys the old controls once and keeps the other form", () => {
    let target = "left";
    const destroyed = vi.fn();
    render(() => div(
      section({ id: "left" }, region({ id: "left", empty: "empty" })),
      section({ id: "right" }, region({ id: "right", type: "stack" })),
      into("right", form({ id: "neighbor" }, input())),
      into(target, form({ id: "moving", onDestroy: destroyed }, input({ defaultValue: "initial" }))),
    ), root);
    const old = root.querySelector("#moving")!;
    const neighbor = root.querySelector<HTMLInputElement>("#neighbor input")!;
    neighbor.value = "keep";
    target = "right";
    forceUpdate();
    forceUpdate();
    expect(root.querySelector("#left")!.textContent).toBe("empty");
    expect(root.querySelectorAll("#moving")).toHaveLength(1);
    expect(root.querySelector("#right #moving")).not.toBe(old);
    expect(root.querySelector<HTMLInputElement>("#moving input")!.value).toBe("initial");
    expect(root.querySelector("#neighbor input")).toBe(neighbor);
    expect(neighbor.value).toBe("keep");
    expect(destroyed).toHaveBeenCalledTimes(1);
  });

  it("removes one multi-target form without changing another target's draft", () => {
    let both = true;
    const destroyed = vi.fn();
    render(() => div(
      region({ id: "left" }), region({ id: "right" }),
      into({
        ...(both ? { left: form({ onDestroy: destroyed }, input({ id: "removed" })) } : {}),
        right: form(textarea({ id: "kept" })),
      }),
    ), root);
    const field = root.querySelector("textarea")!;
    field.value = "draft";
    both = false;
    forceUpdate();
    forceUpdate();
    expect(root.querySelector("#removed")).toBeNull();
    expect(root.querySelector("textarea")).toBe(field);
    expect(field.value).toBe("draft");
    expect(destroyed).toHaveBeenCalledTimes(1);
  });

  it("reorders list fields, removes conditional fields and never submits stale controls", () => {
    let rows = ["a", "b", "c"];
    let extra = true;
    const destroyed = vi.fn();
    render(() => div(region({ id: "forms" }), into("forms", form(
      list(() => rows, name => input({ name })),
      when(() => extra, textarea({ name: "extra", onDestroy: destroyed })),
    ))), root);
    const fields = Array.from(root.querySelectorAll("input"));
    fields.forEach((field, i) => { field.value = `draft-${i}`; });
    rows = ["c", "a"];
    extra = false;
    update();
    forceUpdate();
    expect(root.querySelectorAll("input")[0]).toBe(fields[2]);
    expect(root.querySelectorAll("input")[1]).toBe(fields[0]);
    expect(root.querySelector("textarea")).toBeNull();
    expect(destroyed).toHaveBeenCalledTimes(1);
    expect(Array.from(new FormData(root.querySelector("form")!).entries())).toEqual([
      ["c", "draft-2"], ["a", "draft-0"],
    ]);
  });

  it("retries missing select values when options arrive after a forced refresh", () => {
    let choices: string[] = [];
    let wanted = "b";
    render(() => div(region({ id: "forms" }), into("forms", form(
      select({ value: () => wanted }, list(() => choices, value => option({ value }, value))),
    ))), root);
    const field = root.querySelector("select")!;
    forceUpdate();
    expect(field.selectedIndex).toBe(-1);
    choices = ["a", "b"];
    update();
    expect(field.value).toBe("b");
    choices = ["c", "b", "a"];
    wanted = "c";
    forceUpdate();
    expect(root.querySelector("select")).toBe(field);
    expect(field.value).toBe("c");
    choices = [];
    forceUpdate();
    expect(field.options).toHaveLength(0);
    expect(field.selectedIndex).toBe(-1);
  });

  it("updates validation and range constraints before applying the new value", () => {
    let strict = false;
    render(() => div(region({ id: "forms" }), into("forms", form(
      input({ id: "range", value: strict ? "150" : "75", type: "range", max: strict ? "200" : "100", min: "0" }),
      input({ id: "number", type: "number", required: strict, min: "0", max: strict ? "5" : "20", step: "2" }),
      input({ id: "text", required: strict, pattern: strict ? "[A-Z]+" : ".*" }),
    ))), root);
    const number = root.querySelector<HTMLInputElement>("#number")!;
    const text = root.querySelector<HTMLInputElement>("#text")!;
    number.value = "10";
    text.value = "lower";
    expect(number.checkValidity()).toBe(true);
    expect(text.checkValidity()).toBe(true);
    strict = true;
    forceUpdate();
    expect(root.querySelector<HTMLInputElement>("#range")!.value).toBe("150");
    expect(root.querySelector("#number")).toBe(number);
    expect(root.querySelector("#text")).toBe(text);
    expect(number.validity.rangeOverflow).toBe(true);
    expect(text.validity.patternMismatch).toBe(true);
    number.value = "";
    text.value = "";
    forceUpdate();
    expect(number.validity.valueMissing).toBe(true);
    expect(text.validity.valueMissing).toBe(true);
    strict = false;
    forceUpdate();
    expect(number.checkValidity()).toBe(true);
    expect(text.checkValidity()).toBe(true);
  });

});
