import './style.css'
// import "./app";

import { renderTemplateToHtml } from "./tpl/template";

const people = [
  { name: "Alice" },
  { name: "Bob" },
  { name: "Charlie" },
];

const template = `
div
div/ul .item-list
${people.map(p => `div/ul/li: ${p.name}`).join("\n")}
div/a.link { 
  href="https://example.com"
  target="_blank"
}: 
Visit Example.com 
`

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