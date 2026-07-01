import "nuclo";
import { app } from "./app.ts";

const root = document.querySelector<HTMLDivElement>("#app")!;
render(app, root);
