import type { HttpError, Redirect } from "../../types/index";

// Branded with a registered symbol rather than checked with instanceof, so a
// redirect thrown through one copy of the package is recognised by another.
const BRAND = Symbol.for("nuclo-pages.control");

type Branded<T> = T & { [BRAND]: "redirect" | "error" };

const STATUS_TEXT: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  500: "Internal Error",
};

export function createRedirect(location: string, status = 302): Redirect {
  return { [BRAND]: "redirect", status, location } as Branded<Redirect>;
}

export function createHttpError(status: number, message = STATUS_TEXT[status] ?? "Error"): HttpError {
  return Object.assign(new Error(message), { [BRAND]: "error", status }) as Branded<HttpError>;
}

export function redirect(location: string, status: 301 | 302 | 303 | 307 | 308 = 302): never {
  throw createRedirect(location, status);
}

export function error(status: number, message?: string): never {
  throw createHttpError(status, message);
}

export function notFound(message?: string): never {
  throw createHttpError(404, message);
}

export function isRedirect(value: unknown): value is Redirect {
  return (value as Branded<object> | null | undefined)?.[BRAND] === "redirect";
}

export function isHttpError(value: unknown): value is HttpError {
  return (value as Branded<object> | null | undefined)?.[BRAND] === "error";
}

/** Status and user-facing message for a thrown value. Unexpected errors only show their message in dev. */
export function errorInfo(reason: unknown, dev: boolean): { status: number; message: string } {
  if (isHttpError(reason)) return { status: reason.status, message: reason.message };
  return { status: 500, message: dev && reason instanceof Error ? reason.message : STATUS_TEXT[500] };
}
