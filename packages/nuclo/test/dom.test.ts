// @vitest-environment jsdom
import { describe, it, expect } from "vitest";

// This test checks basic DOM manipulation in a browser-like environment

class Page {
  title: string;
  constructor(title: string) {
    this.title = title;
  }
  getTitle() {
    return this.title;
  }
}

describe("DOM element", () => {
  it("should create a div and set its text content", () => {
    const div = document.createElement("div");
    div.textContent = "Hello, DOM!";
    expect(div.textContent).toBe("Hello, DOM!");
  });
});
