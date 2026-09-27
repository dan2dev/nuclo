import { describe, expect, it } from "vitest";
import {
  createHttpError,
  createRedirect,
  error,
  errorInfo,
  isHttpError,
  isRedirect,
  notFound,
  redirect,
} from "../../src/shared/errors";

const thrown = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (e) {
    return e;
  }
  throw new Error("expected a throw");
};

describe("redirect", () => {
  it("throws a redirect, 302 by default", () => {
    const value = thrown(() => redirect("/login"));
    expect(isRedirect(value)).toBe(true);
    expect(isHttpError(value)).toBe(false);
    expect(value).toMatchObject({ status: 302, location: "/login" });
  });

  it("accepts a status", () => {
    expect(thrown(() => redirect("https://example.com", 301))).toMatchObject({ status: 301, location: "https://example.com" });
  });
});

describe("error / notFound", () => {
  it("throws an Error with a status", () => {
    const value = thrown(() => error(403, "Nope"));
    expect(value).toBeInstanceOf(Error);
    expect(isHttpError(value)).toBe(true);
    expect(isRedirect(value)).toBe(false);
    expect(value).toMatchObject({ status: 403, message: "Nope" });
  });

  it("defaults the message from the status", () => {
    expect(thrown(() => error(404))).toMatchObject({ message: "Not Found" });
    expect(thrown(() => error(401))).toMatchObject({ message: "Unauthorized" });
    expect(thrown(() => error(418))).toMatchObject({ message: "Error" });
  });

  it("notFound is a 404", () => {
    expect(thrown(() => notFound())).toMatchObject({ status: 404, message: "Not Found" });
    expect(thrown(() => notFound("No such post"))).toMatchObject({ status: 404, message: "No such post" });
  });

  it("the create* helpers return instead of throwing", () => {
    expect(isRedirect(createRedirect("/x"))).toBe(true);
    expect(isHttpError(createHttpError(500))).toBe(true);
  });
});

describe("isRedirect / isHttpError", () => {
  it("rejects anything unbranded", () => {
    for (const value of [undefined, null, 0, "", "redirect", {}, [], new Error("x"), { status: 302, location: "/" }]) {
      expect(isRedirect(value)).toBe(false);
      expect(isHttpError(value)).toBe(false);
    }
  });

  it("recognises values branded by another copy of the package", () => {
    const brand = Symbol.for("nuclo-pages.control");
    expect(isRedirect({ [brand]: "redirect", status: 302, location: "/" })).toBe(true);
    expect(isHttpError(Object.assign(new Error("x"), { [brand]: "error", status: 400 }))).toBe(true);
  });
});

describe("errorInfo", () => {
  it("passes HttpError status and message through, in dev and prod", () => {
    const e = createHttpError(422, "Invalid email");
    expect(errorInfo(e, false)).toEqual({ status: 422, message: "Invalid email" });
    expect(errorInfo(e, true)).toEqual({ status: 422, message: "Invalid email" });
  });

  it("hides unexpected error messages in production", () => {
    expect(errorInfo(new Error("db password is hunter2"), false)).toEqual({ status: 500, message: "Internal Error" });
  });

  it("shows unexpected error messages in dev", () => {
    expect(errorInfo(new TypeError("x is undefined"), true)).toEqual({ status: 500, message: "x is undefined" });
  });

  it("handles non-Error throws", () => {
    expect(errorInfo("boom", true)).toEqual({ status: 500, message: "Internal Error" });
    expect(errorInfo(undefined, true)).toEqual({ status: 500, message: "Internal Error" });
  });
});
