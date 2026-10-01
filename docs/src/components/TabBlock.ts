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

const wrap = css("components-tabblock-wrap", { display: "flex", flexDirection: "column", minWidth: "0" });

const tabsBar = css("components-tabblock-tabsBar", { display: "flex", gap: "20px", borderBottom: `1px solid ${colors.border}` });

// The 2px underline sits on the bar's bottom border (negative margin).
const tabBtn = css("components-tabblock-tabBtn", { padding: "10px 2px", marginBottom: "-1px", borderBottom: "2px solid transparent", fontSize: "0.875rem", fontWeight: "500", color: colors.textDim, hover: { color: colors.text } });

const tabBtnActive = css("components-tabblock-tabBtnActive", { color: colors.text, borderBottomColor: colors.primary });

const pane = css("components-tabblock-pane", { display: "none" });

const paneActive = css("components-tabblock-paneActive", { display: "block", paddingTop: "14px" });

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
      { onClick: () => { activeTab = tab.id; update(); } },
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
