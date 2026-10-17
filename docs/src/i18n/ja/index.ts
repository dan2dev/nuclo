import type { LocaleBundle } from "../index.ts";
import * as ui from "./ui.ts";
import * as home from "./home.ts";
import * as docs from "./docs.ts";
import * as examples from "./examples.ts";

export default { ui, home, docs, examples } satisfies LocaleBundle;
