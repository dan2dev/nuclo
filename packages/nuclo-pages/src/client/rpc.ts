import * as devalue from "devalue";
import { createHttpError, createRedirect } from "../shared/errors";

let base = "/";

export function setBase(value: string): void {
  base = value;
}

/** Target of the `$server()` client transform: a stub that POSTs to the server function. */
export function __rpc(id: string, name?: string): (...args: unknown[]) => Promise<unknown> {
  return async (...args) => {
    const response = await fetch(`${base}_server/${id}${name ? `?fn=${encodeURIComponent(name)}` : ""}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-nuclo-rpc": "1" },
      body: devalue.stringify(args),
    });
    const location = response.headers.get("x-nuclo-redirect");
    if (location) throw createRedirect(location);
    const text = await response.text();
    if (!response.ok) throw createHttpError(response.status, messageOf(text) ?? response.statusText);
    return text ? devalue.parse(text) : undefined;
  };
}

function messageOf(text: string): string | undefined {
  try {
    return (JSON.parse(text) as { message?: string }).message;
  } catch {
    return undefined;
  }
}
