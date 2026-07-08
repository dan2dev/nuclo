import "nuclo";
import { styles as s } from "./styles";

let count = 0;

export const app = div(
	s.app,

	h1(s.heading, img(
		s.logo,
		{
			src: "/nuclo-logo.svg",
			alt: "Nuclo logo",
			width: 146,
			height: 40,
		}
	),
	),
	p(
		"Edit ",
		code(s.code, "src/app.ts"),
		" and save to reload."
	),
	button(
		s.button,
		on("click", () => {
			count++;
			update();
		}),
		() => `Count: ${count}`
	),
	div(
		s.links,
		a(s.link, { href: "https://nuclo.dev", target: "_blank", rel: "noopener noreferrer" }, "Docs"),
		a(s.link, { href: "https://github.com/dan2dev/nuclo", target: "_blank", rel: "noopener noreferrer" }, "GitHub")
	)
);
