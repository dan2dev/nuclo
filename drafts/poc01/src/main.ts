import "./style.css";
// import "./app";

import { renderTemplateToHtml } from "./tpl/template";

const people = [{ name: "Alice" }, { name: "Bob" }, { name: "Charlie" }];

const template = `
div
div_ul.item-list#someid
${people.map((p) => `div_ul_li: ${p.name}`).join("\n")}
div_a.link href="https://example.com" target="_blank": Visit Example.com
div_h1: This is a heading
div_span: This is a span element
div_span: Another span element
div: This is a div element
`;

// ideia para chamadas
// div: functionName({name: "John", lastName: "Doe"})

const root = document.getElementById("app");
if (root) {
	console.time("rendering");
	for (let i = 0; i < 100000; i++) {
		renderTemplateToHtml(template);
	}
	const rendered = renderTemplateToHtml(template);
	root.innerHTML = rendered;
	console.timeEnd("rendering");
}
