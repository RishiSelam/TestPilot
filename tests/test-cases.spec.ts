import { test, expect } from "@playwright/test";

const sampleTestCase = {
  id: "TC-001",
  title: "Login validation",
  description: "Check login form",
  steps: "Submit empty form",
  expected: "Show validation error",
  priority: "HIGH",
  status: "READY",
  createdAt: "2026-11-05T09:00:00.000Z",
};

test.describe("Test Cases", () => {
  test("allows a user to create a test case", async ({ page }) => {
    const testCase = {
      id: "TC-PLAYWRIGHT-001",
      title: "Playwright login validation",
      description: "Verify login form validation",
      steps: "Open login page and submit empty credentials",
      expected: "Validation message should appear",
      priority: "HIGH",
      status: "READY",
      createdAt: new Date().toISOString(),
    };

    await page.route("**/api/test-cases", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
        return;
      }

      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(testCase),
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Test Cases" }).click();

    await expect(
      page.getByRole("heading", { name: "Test case library" })
    ).toBeVisible();

    await page.getByRole("button", { name: "New test case" }).click();

    const dialog = page.getByRole("dialog");

    await dialog.getByLabel("Title *").fill(testCase.title);
    await dialog.getByLabel("Description").fill(testCase.description);
    await dialog.getByLabel("Test steps").fill(testCase.steps);
    await dialog.getByLabel("Expected result").fill(testCase.expected);
    await dialog.getByLabel("Priority").selectOption("High");
    await dialog.getByLabel("Status").selectOption("Ready");

    await dialog
      .getByRole("button", { name: "Create test case" })
      .click();

    await expect(page.getByText(testCase.title)).toBeVisible();
    await expect(page.getByText(testCase.id)).toBeVisible();
    await expect(
      page.getByText("Showing 1 of 1 test cases")
    ).toBeVisible();
  });

  test("searches and filters test cases", async ({ page }) => {
    await page.route("**/api/test-cases", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          sampleTestCase,
          {
            ...sampleTestCase,
            id: "TC-002",
            title: "Payment processing",
            description: "Check payment flow",
            expected: "Payment succeeds",
            priority: "LOW",
            status: "DRAFT",
          },
        ]),
      });
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Test Cases" }).click();

    await expect(page.getByText("Login validation")).toBeVisible();
    await expect(page.getByText("Payment processing")).toBeVisible();

    // Search
    await page.getByLabel("Search test cases").fill("Login");

    await expect(page.getByText("Login validation")).toBeVisible();
    await expect(page.getByText("Payment processing")).toBeHidden();

    // Clear search
    await page.getByLabel("Search test cases").clear();

    // Priority filter
    await page.getByLabel("Filter by priority").selectOption("High");

    await expect(page.getByText("Login validation")).toBeVisible();
    await expect(page.getByText("Payment processing")).toBeHidden();

    // Status filter
    await page.getByLabel("Filter by priority").selectOption("All");
    await page.getByLabel("Filter by status").selectOption("Draft");

    await expect(page.getByText("Payment processing")).toBeVisible();
    await expect(page.getByText("Login validation")).toBeHidden();
  });

  test("allows a user to edit a test case", async ({ page }) => {
    const updatedCase = {
      ...sampleTestCase,
      title: "Updated login validation",
      description: "Updated login form checks",
      priority: "CRITICAL",
      status: "BLOCKED",
    };

    await page.route("**/api/test-cases", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([sampleTestCase]),
      });
    });

    await page.route("**/api/test-cases/TC-001", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(updatedCase),
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Test Cases" }).click();

    await page.getByRole("button", {
      name: "Edit Login validation",
    }).click();

    const dialog = page.getByRole("dialog");

    await expect(
      dialog.getByRole("heading", { name: "Edit test case" })
    ).toBeVisible();

    await dialog.getByLabel("Title *").fill(updatedCase.title);
    await dialog
      .getByLabel("Description")
      .fill(updatedCase.description);
    await dialog.getByLabel("Priority").selectOption("Critical");
    await dialog.getByLabel("Status").selectOption("Blocked");

    await dialog.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("Updated login validation")).toBeVisible();
    await expect(page.getByText("Updated login form checks")).toBeVisible();
    const updatedArticle = page.locator("article");

    await expect(
    updatedArticle.getByText("Critical", { exact: true })
    ).toBeVisible();

    await expect(
    updatedArticle.getByText("Blocked", { exact: true })
    ).toBeVisible();
  });

  test("allows a user to delete a test case", async ({ page }) => {
    await page.route("**/api/test-cases", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([sampleTestCase]),
      });
    });

    await page.route("**/api/test-cases/TC-001", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Test case deleted successfully." }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Test Cases" }).click();

    await expect(page.getByText("Login validation")).toBeVisible();

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.getByRole("button", {
      name: "Delete Login validation",
    }).click();

    await expect(page.getByText("Login validation")).toBeHidden();
    await expect(
      page.getByText("Showing 0 of 0 test cases")
    ).toBeVisible();
  });
});