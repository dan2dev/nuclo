import "nuclo";
import nucloLogo from "nuclo/nuclo-logo";
import { styles } from "./styles";

// After import "nuclo", every HTML tag is a global function: main(), p(), a(), ...
// Pass it a class from styles.ts, an attributes object like { href }, and its children.

const links = [
	{ href: "https://nuclo.dev/docs", title: "Docs", text: "Learn the API, from tags to SSR." },
	{ href: "https://nuclo.dev/examples", title: "Examples", text: "Browse runnable apps and patterns." },
	{ href: "https://github.com/dan2dev/nuclo", title: "GitHub", text: "Read the source and report issues." },
];

export const App = () =>
	main(
		styles.page,

		section(
			styles.hero,
			nucloLogo({ height: 72 }, styles.logo),
			p(styles.message, "Your app is ready. Start building in ", code(styles.code, "src/app.ts"), "."),
		),

		nav(
			styles.links,
			...links.map((link) =>
				a(
					styles.link,
					{ href: link.href, target: "_blank", rel: "noopener noreferrer" },
					strong(styles.linkTitle, link.title, span(styles.arrow, { "aria-hidden": "true" }, "↗")),
					span(styles.linkText, link.text),
				),
			),
		),
	);
