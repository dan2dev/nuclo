import "nuclo";
import { cn, colors } from "../styles.ts";

type TocItem = {
  id: string;
  label: string;
  level: number;
};

let activeSection = "";
let tocItems: TocItem[] = [];

export function setTocItems(items: TocItem[]) {
  tocItems = items;
  update();
}

export function setActiveSection(id: string) {
  activeSection = id;
  update();
}

function scrollToSection(id: string) {
  const element = document.getElementById(id);
  if (element) {
    const headerHeight = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
    setActiveSection(id);
  }
}

export function TableOfContents() {
  if (tocItems.length === 0) {
    return null;
  }

  const tocStyle = cn(
    position("sticky")
      .top("100px")
      .width("240px")
      .maxHeight("calc(100vh - 120px)")
      .overflowY("auto")
      .padding("24px")
      .backgroundColor(colors.bgCard)
      .borderRadius("12px")
      .border(`1px solid ${colors.border}`)
      .display("none"),
    { large: display("block") }
  );

  const tocItemStyle = (item: TocItem, isActive: boolean) => cn(
    display("block")
      .padding("8px 12px")
      .borderRadius("6px")
      .fontSize("14px")
      .transition("all 0.2s")
      .cursor("pointer")
      .marginLeft(item.level === 3 ? "16px" : "0")
      .color(isActive ? colors.primary : colors.textMuted)
      .fontWeight(isActive ? "600" : "400")
      .backgroundColor("transparent"),
    {
      hover: color(colors.primary).backgroundColor("rgba(132, 204, 22, 0.1)")
    }
  );

  return nav(
    tocStyle,
    h3(
      cn(
        fontSize("16px")
          .fontWeight("600")
          .color(colors.text)
          .marginBottom("16px")
          .paddingBottom("12px")
          .borderBottom(`1px solid ${colors.border}`)
      ),
      "Contents"
    ),
    ...tocItems.map(item => {
      const isActive = activeSection === item.id;
      return a(
        {
          href: `#${item.id}`,
        },
        tocItemStyle(item, isActive),
        item.label,
        on("click", (e) => {
          e.preventDefault();
          scrollToSection(item.id);
        })
      );
    })
  );
}

