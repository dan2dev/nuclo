// Client code must not import server-only modules: the dev server rejects this file.
import { hostname } from "node:os";

export const where = () => hostname();
