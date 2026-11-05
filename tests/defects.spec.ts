
import { test, expect } from "@playwright/test";

const existingDefects = [
  {
    id: "defect-001",
    title: "Login button does not respond",
    description: "Clicking login produces no response.",
    stepsToReproduce: "Open login page and click Login.",
    expectedResult: "User should be logged in.",
    actualResult: "Nothing happens.",
    severity: "HIGH",
    status: "OPEN",
    environment: "DEVELOPMENT",
    testCase: null,
    testRun: null,
    createdAt: "2026-11-02T10:00:00.000Z",
  },
  {
    id: "defect-002",
    title: "Checkout page crashes",
    description: "Checkout crashes after submitting payment.",
    stepsToReproduce: "Add item and submit payment.",
    expectedResult: "Order should complete.",
    actualResult: "Page crashes.",
    severity: "CRITICAL",
    status: "IN_PROGRESS",
    environment: "STAGING",
    testCase: null,
    testRun: null,
    createdAt: "2026-11-03T10:00:00.000Z",
  },
  {
    id: "defect-003",
    title: "Profile image not updating",
    description: "Updated profile image is not displayed.",
    stepsToReproduce: "Upload a new profile image.",
    expectedResult: "New image should appear.",
    actualResult: "Old image remains.",
    severity: "LOW",
    status: "RESOLVED",
    environment: "PRODUCTION",
    testCase: null,
    testRun: null,
    createdAt: "2026-11-04T10:00:00.000Z",
  },
];

test.describe("Defect Management", () => {
  test("displays defects and overview statistics", async ({ page }) => {
    await page.route("**/api/defects", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(existingDefects),
      });
    });

    await page.goto("/defects");

    await expect(
      page.getByRole("heading", { name: "Defect Management" })
    ).toBeVisible();

    const defectsTable = page.getByRole("table");

    await expect(
      defectsTable.getByText("Login button does not respond")
    ).toBeVisible();

    await expect(
      defectsTable.getByText("Checkout page crashes")
    ).toBeVisible();

    await expect(
      defectsTable.getByText("Profile image not updating")
    ).toBeVisible();

    const overviewCards = page.locator("section.grid").first();

    await expect(overviewCards.getByText("Total Defects")).toBeVisible();
    await expect(overviewCards.getByText("Open", { exact: true })).toBeVisible();
    await expect(overviewCards.getByText("In Progress", { exact: true })).toBeVisible();
    await expect(overviewCards.getByText("Resolved", { exact: true })).toBeVisible();
  });

  test("allows a user to report a new defect", async ({ page }) => {
    const savedDefects = [...existingDefects];
    let createdDefect: Record<string, unknown> | null = null;

    await page.route("**/api/defects", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(savedDefects),
        });
        return;
      }

      if (route.request().method() === "POST") {
        createdDefect = route.request().postDataJSON();

        const newDefect = {
          id: "defect-new",
          ...createdDefect,
          testCase: null,
          testRun: null,
          createdAt: new Date().toISOString(),
        };

        savedDefects.unshift(newDefect);

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newDefect),
        });
      }
    });

    await page.goto("/defects");

    await page.getByRole("button", { name: "Report Defect" }).click();

    await expect(
      page.getByRole("heading", { name: "Report a Defect" })
    ).toBeVisible();

    await page.getByLabel("Title").fill("Search results are not loading");

    await page
      .getByLabel("Description")
      .fill("Search page remains blank after submitting a query.");

    await page
      .getByLabel("Steps to Reproduce")
      .fill("1. Open search. 2. Enter a query. 3. Click Search.");

    await page
      .getByLabel("Expected Result")
      .fill("Relevant search results should appear.");

    await page
      .getByLabel("Actual Result")
      .fill("The page remains blank.");

    await page.getByLabel("Severity").selectOption("HIGH");
    await page.getByLabel("Status").selectOption("OPEN");
    await page.getByLabel("Environment").selectOption("STAGING");

    await page.getByRole("button", { name: "Create Defect" }).click();

    await expect.poll(() => createdDefect).not.toBeNull();

    expect(createdDefect).toMatchObject({
      title: "Search results are not loading",
      description: "Search page remains blank after submitting a query.",
      severity: "HIGH",
      status: "OPEN",
      environment: "STAGING",
    });

    await expect(
      page.getByRole("table").getByText("Search results are not loading")
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Report a Defect" })
    ).not.toBeVisible();
  });

  test("allows a user to edit an existing defect", async ({ page }) => {
    const savedDefects = existingDefects.map((defect) => ({ ...defect }));
    let updatedDefect: Record<string, unknown> | null = null;

    await page.route("**/api/defects", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(savedDefects),
      });
    });

    await page.route("**/api/defects/*", async (route) => {
      if (route.request().method() === "PATCH") {
        const changes = route.request().postDataJSON();
        updatedDefect = changes;

        const index = savedDefects.findIndex(
          (defect) => defect.id === "defect-001"
        );

        savedDefects[index] = {
          ...savedDefects[index],
          ...changes,
        };

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(savedDefects[index]),
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/defects");

    const defectRow = page
      .getByRole("row")
      .filter({ hasText: "Login button does not respond" });

    await defectRow.getByRole("button", { name: "Edit" }).click();

    await expect(
      page.getByRole("heading", { name: "Edit Defect" })
    ).toBeVisible();

    await page
      .getByLabel("Title")
      .fill("Login button responds slowly");

    await page.getByLabel("Severity").selectOption("MEDIUM");
    await page.getByLabel("Status").selectOption("IN_PROGRESS");

    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect.poll(() => updatedDefect).not.toBeNull();

    expect(updatedDefect).toMatchObject({
      title: "Login button responds slowly",
      severity: "MEDIUM",
      status: "IN_PROGRESS",
    });

    await expect(
      page.getByRole("table").getByText("Login button responds slowly")
    ).toBeVisible();
  });

  test("allows a user to delete a defect after confirmation", async ({
    page,
  }) => {
    const savedDefects = existingDefects.map((defect) => ({ ...defect }));
    let deleteRequestReceived = false;

    await page.route("**/api/defects", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(savedDefects),
      });
    });

    await page.route("**/api/defects/*", async (route) => {
      if (route.request().method() === "DELETE") {
        deleteRequestReceived = true;

        const index = savedDefects.findIndex(
          (defect) => defect.id === "defect-001"
        );

        if (index !== -1) {
          savedDefects.splice(index, 1);
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Defect deleted successfully.",
          }),
        });
        return;
      }

      await route.continue();
    });

    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toBe(
        "Are you sure you want to delete this defect?"
      );
      await dialog.accept();
    });

    await page.goto("/defects");

    const defectRow = page
      .getByRole("row")
      .filter({ hasText: "Login button does not respond" });

    await defectRow.getByRole("button", { name: "Delete defect" }).click();

    await expect.poll(() => deleteRequestReceived).toBe(true);

    await expect(
      page.getByRole("table").getByText("Login button does not respond")
    ).not.toBeVisible();
  });

  test("allows a user to search and filter defects", async ({ page }) => {
    await page.route("**/api/defects", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(existingDefects),
      });
    });

    await page.goto("/defects");

    const defectsTable = page.getByRole("table");
    const search = page.getByPlaceholder("Search defects...");

    await search.fill("Checkout");

    await expect(
      defectsTable.getByText("Checkout page crashes")
    ).toBeVisible();

    await expect(
      defectsTable.getByText("Login button does not respond")
    ).not.toBeVisible();

    await search.clear();

    const filters = page.locator("select");

    await filters.nth(0).selectOption("CRITICAL");

    await expect(
      defectsTable.getByText("Checkout page crashes")
    ).toBeVisible();

    await expect(
      defectsTable.getByText("Login button does not respond")
    ).not.toBeVisible();

    await filters.nth(0).selectOption("ALL");
    await filters.nth(1).selectOption("RESOLVED");

    await expect(
      defectsTable.getByText("Profile image not updating")
    ).toBeVisible();

    await expect(
      defectsTable.getByText("Checkout page crashes")
    ).not.toBeVisible();
  });
});
