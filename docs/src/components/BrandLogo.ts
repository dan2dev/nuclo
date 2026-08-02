import { css, cx } from "../styles.ts";

const wrap = css("components-brandlogo-wrap", { display: "inline-flex", alignItems: "center", flexShrink: 0 });
const image = css("components-brandlogo-image", { width: "auto", objectFit: "contain", flexShrink: 0 });
const headerImage = css("components-brandlogo-headerImage", { height: "32px" });
const footerImage = css("components-brandlogo-footerImage", { height: "38px" });

export function BrandLogo({ size = "header" }: { size?: "header" | "footer" } = {}) {
  const imageClass = cx(image, size === "footer" ? footerImage : headerImage);

  return span(
    wrap,
    { role: "img", "aria-label": "Nuclo" },
    img({
      src: "/nuclo-logo.svg",
      alt: "",
      width: 292,
      height: 80,
      class: cx(imageClass, "nuclo-logo-light").className,
    }),
    img({
      src: "/nuclo-logo-dark.svg",
      alt: "",
      width: 292,
      height: 80,
      class: cx(imageClass, "nuclo-logo-dark").className,
    }),
  );
}
