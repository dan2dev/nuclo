import "./style.css";
import "nuclo";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

let counter = 0;

function increment() {
	counter++;
	update();
}

function decrement() {
	counter--;
	update();
}
function reset() {
	counter = 0;
	update();
}

const app = div(
	{ className: "app" },
	h1(
		"counter: ",
		span(() => counter),
	),
	button("+", on("click", increment)),
	button("reset", on("click", reset)),
	button("-", on("click", decrement)),
);

render(app, appRoot);
