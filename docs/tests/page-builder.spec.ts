import { expect, test } from "@playwright/test";

test.setTimeout(30_000);

test("inline editing keeps caret keys local and slash insertion returns focus to the page", async ({ page }) => {
  await page.goto("/examples/page-builder");
  const editor = page.locator("[data-page-builder]");
  const heading = editor.getByRole("textbox", { name: "Edit Heading", exact: true }).first();
  await heading.fill("ABCD");
  await heading.press("End");
  await heading.press("ArrowLeft");
  await heading.press("ArrowLeft");
  await heading.press("/");
  await editor.getByRole("textbox", { name: "Search blocks" }).press("Escape");
  await heading.pressSequentially("X");
  await expect(heading).toHaveText("ABXCD");
  await expect(page).toHaveURL(/\/examples\/page-builder$/);
  await expect(editor.getByLabel("Text", { exact: true })).toHaveValue("ABXCD");
  await heading.press("Enter");
  const paragraph = editor.locator("[data-pb-selected=true] [data-pb-editable]");
  await expect(heading).toHaveText("ABX");
  await expect(paragraph).toHaveText("CD");
  await paragraph.fill("");
  const count = await editor.locator("[data-pb-block]").count();
  await paragraph.press("/");
  const search = editor.getByRole("textbox", { name: "Search blocks" });
  await search.fill("heading");
  await search.press("Enter");
  await expect(editor.locator("[data-pb-block]")).toHaveCount(count);
  const added = editor.locator("[data-pb-selected=true] [data-pb-editable]");
  await expect(added).toBeFocused();
  await added.pressSequentially("New heading");
  await expect(editor.locator("[data-pb-selected=true]")).toHaveAttribute("data-pb-kind", "heading");
  await expect(added).toHaveText("New heading");
});

test("right-click block actions duplicate and delete with undo, and preview keeps inline edits", async ({ page }) => {
  await page.goto("/examples/page-builder");
  const editor = page.locator("[data-page-builder]");
  const heading = editor.getByRole("textbox", { name: "Edit Heading", exact: true }).first();
  await heading.fill("Written on the canvas");
  const count = await editor.locator("[data-pb-block]").count();
  await heading.click({ button: "right" });
  await editor.getByRole("menuitem", { name: "Duplicate", exact: true }).click();
  await expect(editor.locator("[data-pb-block]")).toHaveCount(count + 1);
  await editor.locator("[data-pb-selected=true]").click({ button: "right" });
  await editor.getByRole("menuitem", { name: "Delete block" }).click();
  await expect(editor.locator("[data-pb-block]")).toHaveCount(count);
  await editor.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(editor.locator("[data-pb-block]")).toHaveCount(count + 1);
  await editor.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(editor.locator("[contenteditable=plaintext-only]")).toHaveCount(0);
  await expect(editor.locator("[data-pb-menu]")).toHaveCount(0);
  await editor.getByRole("button", { name: "Back to editing" }).click();
  await expect(heading).toHaveText("Written on the canvas");
});


test("dragging a grip reorders blocks and undo restores their position", async ({ page }) => {
  await page.goto("/examples/page-builder");
  const editor = page.locator("[data-page-builder]");
  const source = editor.locator("[data-pb-layer]").nth(2).locator(".pb-layer-grip");
  const target = editor.locator("[data-pb-layer]").nth(3);
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("Missing outline drag targets");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height - 3, { steps: 12 });
  await expect(editor.locator("[data-pb-drag-preview]")).toBeVisible();
  await expect(target).toHaveAttribute("data-pb-drop", "after");
  await page.mouse.up();
  const firstBlock = editor.locator("[data-pb-kind=section]").nth(1).locator(":scope > [data-pb-block]").first();
  await expect(firstBlock).toHaveAttribute("data-pb-kind", "text");
  await expect(editor.locator("[data-pb-drag-preview]")).toHaveCount(0);
  await editor.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(firstBlock).toHaveAttribute("data-pb-kind", "heading");
});
