import "nuclo";
import { cn, s, colors } from "../../styles.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { examplesContent } from "../../content/examples.ts";
import { setRoute } from "../../router.ts";

// Live demo state
type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
};

let products: Product[] = [
  {
    id: 1,
    name: "Wireless Headphones",
    description: "Premium noise-canceling headphones with 30-hour battery.",
    price: 299.99,
    image: "🎧",
    inStock: true,
  },
  {
    id: 2,
    name: "Smart Watch",
    description: "Track your fitness, receive notifications, and more.",
    price: 399.99,
    image: "⌚",
    inStock: true,
  },
  {
    id: 3,
    name: "Portable Speaker",
    description: "Waterproof speaker with incredible bass and clarity.",
    price: 149.99,
    image: "🔊",
    inStock: false,
  },
];

// Styles
const demoStyle = cn(
  backgroundColor(colors.bgCard)
    .padding("32px")
    .borderRadius("16px")
    .border(`1px solid ${colors.border}`)
    .marginBottom("32px")
);

const headerStyle = cn(
  textAlign("center")
    .marginBottom("24px")
);

const titleStyle = cn(
  fontSize("24px")
    .fontWeight("700")
    .color(colors.text)
    .marginBottom("8px")
);

const subtitleStyle = cn(
  fontSize("14px")
    .color(colors.textMuted)
);

const gridStyle = cn(
  display("grid")
    .gap("20px")
);

const cardStyle = cn(
  backgroundColor(colors.bgLight)
    .borderRadius("12px")
    .overflow("hidden")
    .transition("all 0.3s")
    .cursor("pointer"),
  {
    hover: boxShadow("0 10px 40px rgba(0,0,0,0.2)").transform("translateY(-4px)")
  }
);

const cardImageStyle = cn(
  position("relative")
    .height("140px")
    .display("flex")
    .alignItems("center")
    .justifyContent("center")
    .fontSize("48px")
);

const overlayStyle = cn(
  position("absolute")
    .top("0")
    .left("0")
    .right("0")
    .bottom("0")
    .backgroundColor("rgba(0,0,0,0.6)")
    .display("flex")
    .alignItems("center")
    .justifyContent("center")
);

const overlayTextStyle = cn(
  color("white")
    .fontSize("14px")
    .fontWeight("600")
);

const contentStyle = cn(
  padding("16px")
);

const cardTitleStyle = cn(
  fontSize("16px")
    .fontWeight("600")
    .color(colors.text)
    .marginBottom("8px")
);

const cardDescStyle = cn(
  fontSize("13px")
    .color(colors.textMuted)
    .lineHeight("1.5")
    .marginBottom("16px")
);

const footerStyle = cn(
  display("flex")
    .justifyContent("space-between")
    .alignItems("center")
);

const priceStyle = cn(
  fontSize("18px")
    .fontWeight("700")
    .color(colors.primary)
);

const btnStyle = cn(
  padding("8px 16px")
    .borderRadius("6px")
    .border("none")
    .fontSize("13px")
    .fontWeight("600")
    .cursor("pointer")
    .transition("all 0.2s"),
  {
    hover: backgroundColor(colors.primaryHover)
  }
);

function ProductCard(product: Product) {
  return div(
    cardStyle,
    div(
      cardImageStyle,
      {
        style: {
          background: `linear-gradient(135deg, ${colors.bgCard} 0%, ${colors.bgLight} 100%)`,
        },
      },
      span(
        cn(
          transition("transform 0.3s"),
          {
            hover: transform("scale(1.1)")
          }
        ),
        product.image
      ),
      when(
        () => !product.inStock,
        div(overlayStyle, span(overlayTextStyle, "Out of Stock"))
      )
    ),
    div(
      contentStyle,
      h4(cardTitleStyle, product.name),
      p(cardDescStyle, product.description),
      div(
        footerStyle,
        span(priceStyle, `$${product.price.toFixed(2)}`),
        button(
          btnStyle,
          {
            style: () => ({
              backgroundColor: product.inStock ? colors.primary : colors.bgCard,
              color: product.inStock ? colors.bg : colors.textDim,
              cursor: product.inStock ? "pointer" : "not-allowed",
            }),
          },
          on("click", () => {
            if (product.inStock) {
              alert(`Added ${product.name} to cart!`);
            }
          }),
          product.inStock ? "Add to Cart" : "Unavailable"
        )
      )
    )
  );
}

function LiveStyledCard() {
  return div(
    demoStyle,
    div(
      headerStyle,
      h3(titleStyle, "Featured Products"),
      p(subtitleStyle, "Discover our latest collection")
    ),
    div(
      gridStyle,
      { style: { gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" } },
      list(() => products, product => ProductCard(product))
    )
  );
}

export function StyledCardExamplePage() {
  const example = examplesContent.find(e => e.id === "styled-card")!;

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
    LiveStyledCard(),
    h2(s.h2, "Source Code"),
    CodeBlock(example.code, "typescript")
  );
}
