export const cn =
  <TTagName extends ElementTagName = ElementTagName>(className: string) =>
  (node: ExpandedElement<TTagName>, index: number) => {
    node.classList?.add(className);
  };
