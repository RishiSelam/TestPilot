
import { test, expect } from "@playwright/test";

test.describe("TestPilot dashboard", () => {
  test("loads the dashboard successfully", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("TestPilot | QA Workspace");
    await expect(
      page.getByRole("heading", { name: "Good evening." })
    ).toBeVisible();
  });

  test("displays recent test runs", async ({ page }) => {
    const testRunName = "Playwright dashboard regression";

    await page.route("**/api/test-runs", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "playwright-run-1",
            name: testRunName,
            environment: "STAGING",
            passed: 5,
            failed: 1,
            skipped: 0,
            total: 6,
            status: "FAILED",
            startedAt: "2026-10-24T09:00:00.000Z",
            completedAt: "2026-10-24T09:00:00.000Z",
            createdAt: "2026-10-24T09:00:00.000Z",
            updatedAt: "2026-10-24T09:00:00.000Z",
          },
        ]),
      });
    });

    await page.goto("/");

    await expect(page.getByText(testRunName)).toBeVisible();
    await expect(
      page.getByText("5/6", { exact: true })
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
