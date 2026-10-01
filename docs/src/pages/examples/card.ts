import { cx } from "../../styles.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { withCode } from "../../components/inline-code.ts";
import { cardDelay, es } from "./styles.ts";

export interface ExampleCardProps {
  title: string;
  desc: string;
  code: string;
  preview: () => NodeModLike<"div">;
  heading?: "h2" | "h3";
}

// One example: intro, live preview and its source. Below 1025px preview and code
// share a tab bar; from 1025px they sit side by side and the tabs hide.
export function ExampleCard({ title, desc, code, preview, heading = "h2" }: ExampleCardProps, index: number) {
  let activeTab: "preview" | "code" = "preview";

  function Tab(label: string, tab: "preview" | "code") {
    return button(
      es.tab,
      {
        class: () => cx(es.tab, activeTab === tab ? es.tabActive : null).className,
        "aria-pressed": () => String(activeTab === tab),
      },
      label,
      { onClick: () => { activeTab = tab; update(); } },
    );
  }

  return div(
    es.card,
    cardDelay(index),
    div(
      es.cardTop,
      heading === "h3" ? h3(es.cardTitle, title) : h2(es.cardTitle, title),
      p(es.cardDesc, ...withCode(desc)),
    ),
    div(es.tabs, Tab("Preview", "preview"), Tab("Code", "code")),
    div(
      es.previewPane,
      { class: () => cx(es.previewPane, activeTab === "code" ? es.paneHidden : null).className },
      preview(),
    ),
    div(
      es.codePane,
      { class: () => cx(es.codePane, activeTab === "preview" ? es.paneHidden : null).className },
      CodeBlock({ filename: `${title.replace(/[^a-zA-Z0-9]+/g, "")}.ts`, code }),
    ),
  );
}
