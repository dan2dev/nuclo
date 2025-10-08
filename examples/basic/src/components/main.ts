export type DataT = {
  label: string;
  children: DataT[];
};
const dataRoot: DataT = {
  label: "Root",
  children: [
    {
      label: "Child 1",
      children: [
        { label: "Grandchild 1", children: [] },
        { label: "Grandchild 2", children: [] },
      ],
    },
    { label: "Child 2", children: [] },
  ],
};
const recursiveExpandComponent = (data: DataT): NodeModFn<any> => {
  return div(
    {
      style: {
        paddingLeft: "10px",
        borderLeft: "1px solid #ccc",
      },
    },
    div(
      () => data.label,
      button("new children"),
      on("click", () => {
        data.children.push({
          label: "New Child",
          children: [],
        });
        update();
      }),
    ),
    list(
      () => data.children,
      (child) => recursiveExpandComponent(child),
    ),
  );
};

const simpleComponent = () => {
  return div(
    button(
      "add children",
      on("click", () => {
        dataRoot.children.push({
          label: "New Child",
          children: [],
        });
        update();
      }),
    ),
  );
};
