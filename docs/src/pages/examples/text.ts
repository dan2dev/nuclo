import * as en from "../../i18n/en/examples.ts";
import { bundle } from "../../i18n/index.ts";

/** The examples' text and page labels in the current locale. Small on purpose: the standalone page reads it without the registry. */
export const examplesText = () => bundle()?.examples ?? en;
