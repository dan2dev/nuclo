// main.ts: the browser entry
import "nuclo";
import "./styles.ts";
import { router } from "./routes.ts";
import { App } from "./app.ts";
import { embedded, followTheme, installMemoryHistory } from "./embed.ts";

followTheme();
if (embedded) installMemoryHistory(); // only inside the examples iframe

await router.start(); // resolves the current URL and its page module first
render(App, document.getElementById("app")!);
