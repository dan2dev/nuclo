import { css, colors, cx } from "../styles.ts";

export interface TabBlockTab {
  id: string;
  label: string;
  content: NodeModLike<any>;
}

export interface TabBlockOptions {
  tabs: TabBlockTab[];
  defaultTab?: string;
}

const wrap = css({ display: "flex", flexDirection: "column", minWidth: "0" });

const tabsBar = css({ display: "flex", gap: "4px", borderBottom: `1px solid ${colors.border}` });

const tabBtn = css({ fontSize: "0.8rem", fontWeight: "700", color: colors.textMuted, padding: "8px 12px", borderBottom: "2px solid transparent", borderRadius: "6px 6px 0 0", transition: "all 0.18s ease", cursor: "pointer", backgroundColor: "transparent", border: "none", fontFamily: "'Space Grotesk', system-ui, sans-serif", hover: { color: colors.textDim, backgroundColor: colors.bgSecondary } });

const tabBtnActive = css({ color: colors.primary, borderBottomColor: colors.primary, backgroundColor: colors.primaryAlpha08, hover: { color: colors.primary } });

const pane = css({ display: "none" });

const paneActive = css({ display: "block", paddingTop: "14px" });

export function TabBlock({ tabs, defaultTab }: TabBlockOptions) {
  let activeTab = defaultTab ?? tabs[0]?.id;

  function TabButton(tab: TabBlockTab) {
    return button(
      tabBtn,
      {
        id: `${tab.id}-tab`,
        role: "tab",
        "aria-controls": `${tab.id}-panel`,
        "aria-selected": () => String(activeTab === tab.id),
        class: () => cx(tabBtn, activeTab === tab.id ? tabBtnActive : null).className,
      },
      tab.label,
      on("click", () => { activeTab = tab.id; update(); }),
    );
  }

  function TabPanel(tab: TabBlockTab) {
    return div(
      pane,
      {
        id: `${tab.id}-panel`,
        role: "tabpanel",
        "aria-labelledby": `${tab.id}-tab`,
        tabIndex: 0,
        class: () => cx(pane, activeTab === tab.id ? paneActive : null).className,
      },
      tab.content,
    );
  }

  return div(
    wrap,
    div({ role: "tablist" }, tabsBar, ...tabs.map(TabButton)),
    ...tabs.map(TabPanel),
  );
}
