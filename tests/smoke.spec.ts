
import { test, expect } from "@playwright/test";

test.describe("TestPilot dashboard", () => {
  test("loads the dashboard successfully", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("TestPilot | QA Workspace");
    await expect(
      page.getByRole("heading", { name: "Good evening." })
    ).toBeVisible();
    await expect(page.getByText("Demo data")).toBeVisible();
  });

  test("displays recent test runs", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByText("Authentication regression")
    ).toBeVisible();

    await expect(
      page.getByText("Checkout & payments")
    ).toBeVisible();
  });

  test("allows switching the appearance", async ({ page }) => {
    await page.goto("/");

    const themeButton = page.getByRole("button", {
      name: "Toggle appearance",
    });

    await expect(themeButton).toBeVisible();
    await themeButton.click();

    await expect(page.locator("html")).toHaveClass(/dark|light/);
  });
});
