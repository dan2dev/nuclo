import "nuclo";
import { Logo } from "./logo";
import { styles as s } from "./styles";

let count = 0;

const links = [
	{ href: "https://nuclo.dev/docs", title: "Docs", text: "Learn the API, from tags to SSR." },
	{ href: "https://nuclo.dev/examples", title: "Examples", text: "Browse runnable apps and patterns." },
	{ href: "https://github.com/dan2dev/nuclo", title: "GitHub", text: "Read the source and report issues." },
];

export const App = () => main(
	s.page,

	Logo(),

	section(
		s.card,
		button(
			s.button,
			{ onClick: () => { count++; update(); } },
			() => `Count is ${count}`,
		),
	),

	nav(
		s.links,
		...links.map(({ href, title, text }) =>
			a(
				s.link,
				{ href, target: "_blank", rel: "noopener noreferrer" },
				strong(title, span(s.arrow, " →")),
				span(s.linkText, text),
			),
		),
	),
);
