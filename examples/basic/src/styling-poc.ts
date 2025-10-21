const styleState = {
  initialized: false,
  sheet: new CSSStyleSheet(),
};
if (!styleState.initialized) {
  styleState.initialized = true;
  document.adoptedStyleSheets = [
    ...document.adoptedStyleSheets,
    styleState.sheet,
  ];
}
export const bg =
  (colorValue: string) => (el: ExpandedElement, index: number) => {
    const className = `bg-${colorValue.replace("#", "")}`;
    el.classList?.add(className);
    styleState.sheet.insertRule(`
  .${className} {
    background-color: ${colorValue};
  }
`);
  };

export const bgRed = (el: ExpandedElement, index: number) => {
  el.classList?.add("bg-red");
  styleState.sheet.insertRule(`
  .bg-red {
    background-color: red;
  }
`);
};

