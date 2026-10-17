import * as en from "../../i18n/en/home.ts";
import { bundle } from "../../i18n/index.ts";

/** The home page's text in the current locale. Call it when a section is built. */
export const home = () => bundle()?.home ?? en;
