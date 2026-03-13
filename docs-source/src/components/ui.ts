import "nuclo";
import { cn, s, colors } from "../styles.ts";
import { CodeBlock } from "./CodeBlock.ts";
import { ArrowRightIcon } from "./icons.ts";
import { setRoute } from "../router.ts";
import type { Route } from "../router.ts";

// ─── Page Header ──────────────────────────────────────────────────────────────

export function PageHeader(title: string, subtitle: string, badge?: string) {
  return div(
    cn(marginBottom("48px")),
    badge
      ? span(
          cn(
            display("inline-flex").alignItems("center").gap("6px")
              .padding("4px 12px").borderRadius("99px").marginBottom("20px")
              .backgroundColor("rgba(132, 204, 22, 0.08)")
              .border(`1px solid ${colors.borderGlow}`)
              .fontSize("12px").fontWeight("600").color(colors.primary)
              .letterSpacing("0.04em").display("inline-flex")
          ),
          badge
        )
      : null,
    h1(s.pageTitle, { className: "gradient-text" }, title),
    p(s.pageSubtitle, subtitle)
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

export function Breadcrumb(items: Array<{ label: string; route?: Route }>) {
  return div(
    cn(
      display("flex").alignItems("center").gap("6px")
        .marginBottom("32px").fontSize("13px")
    ),
    ...items.flatMap((item, i) => {
      const isLast = i === items.length - 1;
      const el = item.route && !isLast
        ? a(
            cn(
              color(colors.textDim).cursor("pointer").transition("color 0.15s"),
              { hover: color(colors.textMuted) }
            ),
            item.label,
            on("click", (e) => { e.preventDefault(); setRoute(item.route!); })
          )
        : span(cn(isLast ? color(colors.textMuted) : color(colors.textDim)), item.label);
      return isLast ? [el] : [el, span(cn(color(colors.border).paddingLeft("2px").paddingRight("2px")), "›")];
    })
  );
}

// ─── Note Card ────────────────────────────────────────────────────────────────

type NoteType = "info" | "warning" | "tip";

export function NoteCard(type: NoteType, ...content: unknown[]) {
  const cfg = {
    info:    { bg: "rgba(132, 204, 22, 0.06)",  border: colors.borderGlow,                   color: colors.primary,        icon: "ℹ",  label: "Note"    },
    warning: { bg: "rgba(251, 146, 60, 0.06)",  border: "rgba(251, 146, 60, 0.4)",           color: "#fb923c",             icon: "⚠",  label: "Warning" },
    tip:     { bg: "rgba(34, 211, 238, 0.06)",  border: "rgba(34, 211, 238, 0.3)",           color: colors.accentSecondary, icon: "💡", label: "Tip"     },
  }[type];

  return div(
    cn(
      padding("14px 20px").borderRadius("10px").marginBottom("24px")
        .display("flex").gap("12px").alignItems("flex-start")
    ),
    { style: { backgroundColor: cfg.bg, borderLeft: `3px solid ${cfg.border}` } },
    span(
      cn(fontSize("12px").fontWeight("700").letterSpacing("0.06em").textTransform("uppercase")),
      { style: { color: cfg.color, whiteSpace: "nowrap", paddingTop: "2px" } },
      `${cfg.icon} ${cfg.label}`
    ),
    div(
      cn(fontSize("14px").color(colors.textMuted).lineHeight("1.75")),
      ...(content as HTMLElement[])
    )
  );
}

// ─── Pitfall Card ─────────────────────────────────────────────────────────────

export function PitfallCard(opts: {
  title: string;
  problemContent: unknown[];
  problemCode: string;
  solutionContent: unknown[];
  solutionCode: string;
  why?: string;
}) {
  return div(
    cn(
      backgroundColor(colors.bgCard).borderRadius("16px")
        .border(`1px solid ${colors.border}`).overflow("hidden").marginBottom("32px")
    ),
    // Header
    div(
      cn(
        padding("14px 24px").backgroundColor(colors.bgLight)
          .borderBottom(`1px solid ${colors.border}`)
          .display("flex").alignItems("center").gap("8px")
      ),
      span(cn(fontSize("15px").fontWeight("600").color(colors.text)), opts.title)
    ),
    // Problem / Solution columns
    div(
      { className: "pitfall-grid" },
      // Problem
      div(
        { className: "pitfall-problem" },
        div(
          cn(display("flex").alignItems("center").gap("8px").marginBottom("14px")),
          span(
            cn(
              fontSize("11px").fontWeight("700").padding("3px 10px")
                .borderRadius("99px").textTransform("uppercase").letterSpacing("0.06em")
            ),
            { style: { backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#ef4444" } },
            "❌ Problem"
          )
        ),
        p(cn(fontSize("13px").color(colors.textMuted).lineHeight("1.7").marginBottom("14px")), ...(opts.problemContent as HTMLElement[])),
        CodeBlock(opts.problemCode, "typescript", false)
      ),
      // Solution
      div(
        cn(padding("20px 24px")),
        div(
          cn(display("flex").alignItems("center").gap("8px").marginBottom("14px")),
          span(
            cn(
              fontSize("11px").fontWeight("700").padding("3px 10px")
                .borderRadius("99px").textTransform("uppercase").letterSpacing("0.06em")
            ),
            { style: { backgroundColor: "rgba(132, 204, 22, 0.15)", color: colors.primary } },
            "✅ Solution"
          )
        ),
        p(cn(fontSize("13px").color(colors.textMuted).lineHeight("1.7").marginBottom("14px")), ...(opts.solutionContent as HTMLElement[])),
        CodeBlock(opts.solutionCode, "typescript", false)
      )
    ),
    // Why (optional)
    opts.why
      ? div(
          cn(
            padding("14px 24px").borderTop(`1px solid ${colors.border}`)
              .backgroundColor(colors.bgLight)
              .display("flex").gap("12px").alignItems("flex-start")
          ),
          span(
            cn(fontSize("11px").fontWeight("700").letterSpacing("0.06em").textTransform("uppercase")),
            { style: { color: colors.textDim, whiteSpace: "nowrap", paddingTop: "2px" } },
            "Why?"
          ),
          p(cn(fontSize("13px").color(colors.textMuted).lineHeight("1.7")), opts.why)
        )
      : null
  );
}

// ─── API Entry ────────────────────────────────────────────────────────────────

export function ApiEntry(opts: {
  id?: string;
  signature: string;
  description: string;
  points?: string[];
}) {
  return div(
    cn(marginBottom("48px")),
    div(
      cn(
        backgroundColor(colors.bgCode).borderRadius("12px")
          .padding("14px 20px").marginBottom("16px")
          .border(`1px solid ${colors.borderGlow}`)
          .display("flex").alignItems("center").justifyContent("space-between")
          .flexWrap("wrap").gap("8px")
      ),
      opts.id ? { id: opts.id } : {},
      code(
        cn(fontSize("15px").fontWeight("600").color(colors.primary)),
        { style: { fontFamily: "'Courier New', Courier, monospace" } },
        opts.signature
      ),
      span(
        cn(
          fontSize("11px").fontWeight("600").padding("3px 8px").borderRadius("6px")
            .textTransform("uppercase").letterSpacing("0.06em").color(colors.textDim)
        ),
        { style: { backgroundColor: colors.bgLight } },
        "Function"
      )
    ),
    p(cn(fontSize("15px").color(colors.textMuted).lineHeight("1.75")), opts.description),
    opts.points
      ? div(
          cn(marginTop("12px").display("flex").flexDirection("column").gap("6px")),
          ...opts.points.map((pt) =>
            div(
              cn(display("flex").gap("10px").alignItems("flex-start")),
              span(cn(color(colors.primary).fontWeight("700").fontSize("14px")), "·"),
              span(cn(fontSize("14px").color(colors.textMuted).lineHeight("1.6")), pt)
            )
          )
        )
      : null
  );
}

// ─── Step Card ────────────────────────────────────────────────────────────────

export function StepCard(step: number, title: string, ...content: unknown[]) {
  return div(
    cn(display("flex").gap("20px").marginBottom("40px")),
    div(
      cn(
        display("flex").alignItems("center").justifyContent("center")
          .fontSize("15px").fontWeight("800").color(colors.bg).borderRadius("10px")
      ),
      { style: { flexShrink: "0", width: "36px", height: "36px", background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` } },
      String(step)
    ),
    div(
      { style: { flex: "1", minWidth: "0" } },
      h3(cn(fontSize("17px").fontWeight("600").color(colors.text).marginBottom("16px")), title),
      ...(content as HTMLElement[])
    )
  );
}

// ─── Next Steps ───────────────────────────────────────────────────────────────

export function NextSteps(links: Array<{ label: string; description: string; route: Route }>) {
  return div(
    cn(marginTop("64px").paddingTop("40px").borderTop(`1px solid ${colors.border}`)),
    h2(s.h2, "Next Steps"),
    div(
      cn(
        display("grid").gap("16px").gridTemplateColumns("1fr"),
        { medium: gridTemplateColumns("repeat(2, 1fr)").gap("20px") }
      ),
      ...links.map((link) =>
        div(
          cn(
            backgroundColor(colors.bgCard).borderRadius("14px")
              .border(`1px solid ${colors.border}`).padding("20px 24px")
              .cursor("pointer").transition("all 0.2s")
              .display("flex").alignItems("center").justifyContent("space-between").gap("12px"),
            { hover: border(`1px solid ${colors.primary}`).transform("translateY(-1px)") }
          ),
          div(
            h3(cn(fontSize("15px").fontWeight("600").color(colors.text).marginBottom("4px")), link.label),
            p(cn(fontSize("13px").color(colors.textMuted).lineHeight("1.5")), link.description)
          ),
          span(cn(color(colors.primary)), ArrowRightIcon()),
          on("click", () => setRoute(link.route))
        )
      )
    )
  );
}

// ─── Quick Reference Table ────────────────────────────────────────────────────

export function QuickRefTable(rows: Array<{ key: string; value: string }>) {
  return div(
    cn(
      backgroundColor(colors.bgCard).borderRadius("14px")
        .border(`1px solid ${colors.border}`).overflow("hidden").marginBottom("24px")
    ),
    ...rows.map((row, i) =>
      div(
        cn(
          display("flex").gap("16px").padding("12px 20px").alignItems("flex-start"),
          { medium: gap("32px") }
        ),
        i < rows.length - 1
          ? { style: { borderBottom: `1px solid ${colors.border}` } }
          : {},
        code(
          cn(fontSize("13px").fontWeight("600").color(colors.primary)),
          { style: { fontFamily: "'Courier New', Courier, monospace", whiteSpace: "nowrap", flexShrink: "0", minWidth: "120px" } },
          row.key
        ),
        span(cn(fontSize("13px").color(colors.textMuted).lineHeight("1.6")), row.value)
      )
    )
  );
}
