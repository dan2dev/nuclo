import "nuclo";
import { cn, s, colors } from "../../styles.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { examplesContent } from "../../content/examples.ts";
import { setRoute } from "../../router.ts";

// Live demo state
type Product = { id: number; title: string; category: string; price: number };
type State = {
  status: "idle" | "loading" | "success" | "error";
  products: Product[];
  error?: string;
};

let state: State = { status: "idle", products: [] };
let searchQuery = "phone";

// Styles
const demoStyle = cn(
  backgroundColor(colors.bgCard)
    .padding("32px")
    .borderRadius("16px")
    .border(`1px solid ${colors.border}`)
    .marginBottom("32px")
);

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
    .color(colors.bg)
    .border("none")
    .borderRadius("8px")
    .fontSize("14px")
    .fontWeight("600")
    .cursor("pointer")
    .transition("all 0.2s")
);

const btnDisabledStyle = {
  backgroundColor: colors.bgLight,
  color: colors.textDim,
  cursor: "not-allowed",
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
    .transition("all 0.2s")
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
    demoStyle,
    h3(cn(fontSize("18px").fontWeight("600").color(colors.text).marginBottom("20px")), "Product Search"),
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
        },
        on("input", (e) => {
          searchQuery = (e.target as HTMLInputElement).value;
          update();
        }),
        on("keydown", (e) => {
          if (e.key === "Enter") fetchProducts();
        }),
        on("focus", (e) => {
          (e.target as HTMLElement).style.borderColor = colors.primary;
        }),
        on("blur", (e) => {
          (e.target as HTMLElement).style.borderColor = colors.border;
        })
      ),
      button(
        btnStyle,
        {
          disabled: () => state.status === "loading" || !searchQuery.trim(),
          style: () => state.status === "loading" || !searchQuery.trim() ? btnDisabledStyle : {},
        },
        () => state.status === "loading" ? "Searching..." : "Search",
        on("click", fetchProducts),
        on("mouseenter", (e) => {
          if (state.status !== "loading" && searchQuery.trim()) {
            (e.target as HTMLElement).style.backgroundColor = colors.primaryHover;
          }
        }),
        on("mouseleave", (e) => {
          if (state.status !== "loading" && searchQuery.trim()) {
            (e.target as HTMLElement).style.backgroundColor = colors.primary;
          }
        })
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
              on("mouseenter", (e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = colors.bgCard;
              }),
              on("mouseleave", (e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = colors.bgLight;
              }),
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

  return div(
    s.pageContent,
    a(
      cn(color(colors.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),
      "← Back to Examples",
      on("click", (e) => {
        e.preventDefault();
        setRoute("examples");
      })
    ),
    h1(s.pageTitle, example.title),
    p(s.pageSubtitle, example.description),
    LiveAsync(),
    h2(s.h2, "Source Code"),
    CodeBlock(example.code, "typescript")
  );
}
