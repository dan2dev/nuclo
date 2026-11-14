// The showcase's small design system: colours and a few styled building blocks.
type Text = string | (() => string);

export const color = {
  page: "#f3f4f8",
  card: "#ffffff",
  field: "#f1f3f7",
  text: "#111827",
  muted: "#6b7280",
  accent: "#4f46e5",
  accentSoft: "#e0e7ff",
  good: "#16a34a",
  bad: "#dc2626",
};

export const row = { flexDirection: "row", gap: 10, alignItems: "center" };

export const heading = (text: Text, size = 18) =>
  span(text, { style: { color: color.text, fontSize: size, fontWeight: "bold" } });

export const body = (text: Text) => span(text, { style: { color: color.text, fontSize: 14 } });

export const muted = (text: Text, size = 13) => span(text, { style: { color: color.muted, fontSize: size } });

export const card = (...children: NodeModLike<"div">[]) =>
  div({ style: { backgroundColor: color.card, borderRadius: 14, padding: 16, gap: 12 } }, ...children);

/** A filled button. Any view is clickable, so buttons can be fully styled. */
export const action = (label: Text, onClick: () => void, enabled: () => boolean = () => true) =>
  div(
    {
      style: () => ({
        backgroundColor: color.accent,
        borderRadius: 10,
        padding: 12,
        alignItems: "center",
        opacity: enabled() ? 1 : 0.4,
      }),
      onClick: () => enabled() && onClick(),
    },
    span(label, { style: { color: "#ffffff", fontSize: 15, fontWeight: "bold" } }),
  );

/** A pill that is filled while `active()`: tabs, segmented choices. */
export const chip = (label: string, active: () => boolean, onClick: () => void) =>
  div(
    {
      style: () => ({
        backgroundColor: active() ? color.accent : color.accentSoft,
        borderRadius: 16,
        padding: 8,
        flex: 1,
        alignItems: "center",
      }),
      onClick,
    },
    span(label, { style: () => ({ color: active() ? "#ffffff" : color.accent, fontSize: 13, fontWeight: "bold" }) }),
  );
