import { cn, s, colors } from "../../styles.ts";
import { examplesContent } from "../../content/examples.ts";
import { ExampleLayout } from "../../components/ExampleLayout.ts";

// Live demo state
type Product = { id: number; title: string; category: string; price: number };
type State = {
  status: "idle" | "loading" | "success" | "error";
  products: Product[];
  error?: string;
  inputFocused: boolean;
};

let state: State = { status: "idle", products: [], inputFocused: false };
let searchQuery = "phone";


const inputStyle = cn(
  padding("10px 14px")
    .backgroundColor(colors.bgLight)
    .color(colors.text)
    .border(`1px solid ${colors.border}`)
    .borderRadius("8px")
    .fontSize("14px")
    .outline("none")
    .flex("1")
    .transition("border-color 0.2s")
);

const btnStyle = cn(
  padding("10px 20px")
    .backgroundColor(colors.primary)
    .color(colors.primaryText)
    .border("none")
    .borderRadius("8px")
    .fontSize("14px")
    .fontWeight("600")
    .cursor("pointer")
    .transition("all 0.2s"),
  { hover: backgroundColor(colors.primaryHover) }
);

const btnDisabledStyle = {
  backgroundColor: colors.bgLight,
  color: colors.textDim,
  cursor: "not-allowed",
};
const btnEnabledStyle = {
  backgroundColor: colors.primary,
  color: colors.primaryText,
  cursor: "pointer",
};

const productGridStyle = cn(
  display("grid")
    .gap("12px")
    .marginTop("20px")
);

const productCardStyle = cn(
  padding("16px")
    .backgroundColor(colors.bgLight)
    .borderRadius("10px")
    .transition("all 0.2s"),
  { hover: backgroundColor(colors.bgCard) }
);

const loadingStyle = cn(
  textAlign("center")
    .padding("32px")
    .color(colors.textMuted)
);

const errorStyle = cn(
  padding("16px")
    .backgroundColor("rgba(239, 68, 68, 0.1)")
    .borderRadius("8px")
    .color("#ef4444")
    .marginTop("16px")
);

async function fetchProducts() {
  if (!searchQuery.trim()) return;

  state.status = "loading";
  state.error = undefined;
  update();

  try {
    const response = await fetch(
      `https://dummyjson.com/products/search?q=${searchQuery}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = await response.json();
    state.products = data.products.slice(0, 6);
    state.status = "success";
  } catch (err) {
    state.status = "error";
    state.error = (err as Error).message;
  }

  update();
}

function LiveAsync() {
  return div(
    div(
      s.flex,
      s.gap8,
      input(
        inputStyle,
        {
          type: "search",
          placeholder: "Search products...",
          value: () => searchQuery,
          disabled: () => state.status === "loading",
          style: () => ({ borderColor: state.inputFocused ? colors.primary : colors.border }),
        },
        on("input", (e) => {
          searchQuery = (e.target as HTMLInputElement).value;
          update();
        }),
        on("keydown", (e) => {
          if (e.key === "Enter") fetchProducts();
        }),
        on("focus", () => {
          state.inputFocused = true;
          update();
        }),
        on("blur", () => {
          state.inputFocused = false;
          update();
        })
      ),
      button(
        btnStyle,
        {
          disabled: () => state.status === "loading" || !searchQuery.trim(),
          style: () => state.status === "loading" || !searchQuery.trim() ? btnDisabledStyle : btnEnabledStyle,
        },
        () => state.status === "loading" ? "Searching..." : "Search",
        on("click", fetchProducts)
      )
    ),
    when(
      () => state.status === "loading",
      div(loadingStyle, "Loading products...")
    ).when(
      () => state.status === "error",
      div(
        errorStyle,
        s.flexBetween,
        span(() => `Error: ${state.error}`),
        button(
          cn(
            padding("6px 12px")
              .backgroundColor("transparent")
              .color("#ef4444")
              .border("1px solid #ef4444")
              .borderRadius("6px")
              .fontSize("13px")
              .cursor("pointer")
          ),
          "Retry",
          on("click", fetchProducts)
        )
      )
    ).when(
      () => state.status === "success" && state.products.length > 0,
      div(
        p(cn(fontSize("13px").color(colors.textDim).marginTop("16px")), () => `Found ${state.products.length} products`),
        div(
          productGridStyle,
          { style: { gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" } },
          list(() => state.products, product =>
            div(
              productCardStyle,
              h4(cn(fontSize("14px").fontWeight("600").color(colors.text).marginBottom("6px")), product.title),
              p(cn(fontSize("12px").color(colors.textDim).margin("0 0 8px 0")), product.category),
              p(cn(fontSize("16px").fontWeight("700").color(colors.primary).margin("0")), `$${product.price.toFixed(2)}`)
            )
          )
        )
      )
    ).when(
      () => state.status === "success" && state.products.length === 0,
      div(cn(textAlign("center").padding("32px").color(colors.textDim)), () => `No products found for "${searchQuery}"`)
    ).else(
      div(cn(textAlign("center").padding("32px").color(colors.textDim)), "Enter a search term and click Search")
    )
  );
}

export function AsyncExamplePage() {
  const example = examplesContent.find(e => e.id === "async")!;
  return ExampleLayout({
    title: example.title,
    description: example.description,
    demo: LiveAsync(),
    code: example.code,
  });
}
