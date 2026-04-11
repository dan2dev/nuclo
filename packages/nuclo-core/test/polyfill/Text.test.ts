/// <reference path="../../types/index.d.ts" />
import { describe, it, expect } from "vitest";
import { NucloText } from "../../src/polyfill/Text";

describe("NucloText", () => {
  it("keeps nodeValue/data/textContent in sync", () => {
    const t = new NucloText("hello");
    expect(t.nodeValue).toBe("hello");
    expect(t.data).toBe("hello");
    expect(t.textContent).toBe("hello");

    t.nodeValue = "world";
    expect(t.nodeValue).toBe("world");
    expect(t.data).toBe("world");
    expect(t.textContent).toBe("world");
  });
});

