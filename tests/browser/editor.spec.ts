import { test, expect } from "@playwright/test";
for (const library of ["shadcn", "mui", "antd"])
  test(`${library}: choose variant, edit, undo and generate code`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.getByLabel("UI library").selectOption(library);
    await page
      .getByRole("button", { name: "Create project", exact: true })
      .click();
    const tile = page.locator(".variantTile").first();
    await tile.getByRole("button", { name: "Add" }).click();
    const button = page.locator(".canvas button");
    await expect(button).toHaveCount(1);
    await button.click({ force: true });
    await page.getByLabel("Text", { exact: true }).fill("Save dashboard");
    await expect(button).toHaveText("Save dashboard");
    await page.getByTitle("Duplicate", { exact: true }).click();
    await expect(page.locator(".canvas button")).toHaveCount(2);
    await page.getByTitle("Undo", { exact: true }).click();
    await expect(page.locator(".canvas button")).toHaveCount(1);
    await page.getByTitle("Redo", { exact: true }).click();
    await expect(page.locator(".canvas button")).toHaveCount(2);
    await page.getByRole("button", { name: "Code", exact: true }).click();
    await expect(page.locator(".codeDialog textarea")).toHaveValue(
      /Save dashboard/,
    );
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await expect(page.locator(".canvas .selected")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
test("drag variant into root and retain chosen size", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  const tile = page.locator(".variantTile").filter({ hasText: "outline · lg" });
  await tile.dragTo(page.locator(".empty"));
  await expect(page.locator(".canvas button")).toHaveAttribute(
    "data-variant",
    "outline",
  );
  await expect(page.locator(".canvas button")).toHaveAttribute(
    "data-size",
    "lg",
  );
  await page.screenshot({
    path: "/tmp/component-studio-editor.png",
    fullPage: true,
  });
});
