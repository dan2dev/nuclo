//CSSStyleSheet API
function createCSSClass(className: string, styles: Record<string, string>): void {
  let styleSheet = document.querySelector("#nuclo-styles") as HTMLStyleElement;

  if (!styleSheet) {
    styleSheet = document.createElement("style");
    styleSheet.id = "nuclo-styles";
    document.head.appendChild(styleSheet);
  }

  const rules = Object.entries(styles)
    .map(([property, value]) => `${property}: ${value}`)
    .join("; ");

  styleSheet.sheet?.insertRule(`.${className} { ${rules} }`, styleSheet.sheet.cssRules.length);
}


createCSSClass("dynamic-header", {
  "font-size": "24px",
  "font-weight": "bold",
  "text-align": "center",
  color: "#FF0000",
});
