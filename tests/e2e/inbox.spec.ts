import { test, expect } from "@playwright/test";

// Golden-path smoke test over the demo inbox (no auth, deterministic data).
// Exercises the exact issues we fixed: folder switching without reload,
// message view, and the AI draft panel.

test("inbox renders demo mail with AI summaries", async ({ page }) => {
  await page.goto("/inbox");
  await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();
  await expect(page.getByText("Design review tomorrow at 2pm")).toBeVisible();
  // AI summary renders inline on the row.
  await expect(page.getByText("Sarah wants you at tomorrow's 2pm design review.")).toBeVisible();
});

test("folder switch updates content without a full reload", async ({ page }) => {
  await page.goto("/inbox");
  await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();

  // Client-side navigation via the nav link (no page.goto / reload).
  // exact:true avoids matching the starred row's "starred" icon aria-label.
  await page.getByRole("link", { name: "Starred", exact: true }).first().click();

  await expect(page).toHaveURL(/label=STARRED/);
  await expect(page.getByRole("heading", { name: "Starred" })).toBeVisible();
  // The promo/newsletter mail from the inbox must NOT appear under Starred.
  await expect(page.getByText("70% off TVs — this weekend only")).toHaveCount(0);

  // Switch back to Inbox — content returns immediately.
  await page.getByRole("link", { name: "Inbox", exact: true }).first().click();
  await expect(page).toHaveURL(/\/inbox(\?|$)/);
  await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();
  await expect(page.getByText("Design review tomorrow at 2pm")).toBeVisible();
});

test("opening a message shows the body and AI draft panel", async ({ page }) => {
  await page.goto("/inbox");
  await page.getByText("Design review tomorrow at 2pm").click();

  await expect(page.getByRole("heading", { name: "Design review tomorrow at 2pm" })).toBeVisible();
  await expect(page.getByText(/Can you join the design review/)).toBeVisible();

  // Open the AI draft drawer.
  await page.getByRole("button", { name: /Draft reply/ }).click();
  await expect(page.getByRole("dialog", { name: "AI draft reply" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Generate/ })).toBeVisible();
});
