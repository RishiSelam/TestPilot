import { test, expect } from "@playwright/test";

const existingRuns = [
  {
    id: "run-1",
    name: "Login regression suite",
    environment: "DEVELOPMENT",
    passed: 8,
    failed: 2,
    skipped: 1,
    total: 11,
    status: "FAILED",
    startedAt: "2026-11-04T10:00:00.000Z",
    completedAt: "2026-11-04T10:05:00.000Z",
  },
  {
    id: "run-2",
    name: "Checkout smoke tests",
    environment: "STAGING",
    passed: 10,
    failed: 0,
    skipped: 0,
    total: 10,
    status: "PASSED",
    startedAt: "2026-11-03T10:00:00.000Z",
    completedAt: "2026-11-03T10:03:00.000Z",
  },
];

test.describe("Test Runs", () => {
  test("displays execution history and summary totals", async ({ page }) => {
    await page.route("**/api/test-runs", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(existingRuns),
      });
    });

    await page.goto("/test-runs");

    await expect(
      page.getByRole("heading", { name: "Test Runs" })
    ).toBeVisible();

    const runsTable = page.getByRole("table");

    await expect(
      runsTable.getByText("Login regression suite")
    ).toBeVisible();

    await expect(
      runsTable.getByText("Checkout smoke tests")
    ).toBeVisible();

    const summaryCards = page.locator("section.grid > div");

    await expect(summaryCards.nth(0)).toContainText("2");
    await expect(summaryCards.nth(1)).toContainText("18");
    await expect(summaryCards.nth(2)).toContainText("2");

    await expect(summaryCards.nth(0)).toContainText("Total executions");
    await expect(summaryCards.nth(1)).toContainText("Tests passed");
    await expect(summaryCards.nth(2)).toContainText("Tests failed");
  });

  test("allows a user to create a partially completed test run", async ({
    page,
  }) => {
    const savedRuns: Record<string, unknown>[] = [];
    let createdRun: Record<string, unknown> | null = null;

    await page.route("**/api/test-runs", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(savedRuns),
        });
        return;
      }

      if (route.request().method() === "POST") {
        createdRun = route.request().postDataJSON();

        const newRun = {
          id: "run-new",
          ...createdRun,
          total: 12,
          status: "PARTIAL",
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        savedRuns.push(newRun);

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newRun),
        });
      }
    });

    await page.goto("/test-runs");

    await page.getByRole("button", { name: "New test run" }).click();

    await page.getByLabel("Run name").fill("Authentication test suite");
    await page.getByLabel("Environment").selectOption("DEVELOPMENT");
    await page.getByLabel("Passed").fill("10");
    await page.getByLabel("Failed").fill("0");
    await page.getByLabel("Skipped").fill("2");

    await page.getByRole("button", { name: "Save test run" }).click();

    await expect.poll(() => createdRun).not.toBeNull();

    expect(createdRun).toMatchObject({
      name: "Authentication test suite",
      environment: "DEVELOPMENT",
      passed: 10,
      failed: 0,
      skipped: 2,
    });

    const runsTable = page.getByRole("table");

    await expect(
      runsTable.getByText("Authentication test suite")
    ).toBeVisible();

    await expect(runsTable.getByText("Partial")).toBeVisible();

    await expect(page.getByRole("status")).toContainText(
      "Test run created and saved successfully."
    );
  });

  test("allows a user to create a failed test run", async ({ page }) => {
    const savedRuns: Record<string, unknown>[] = [];
    let createdRun: Record<string, unknown> | null = null;

    await page.route("**/api/test-runs", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(savedRuns),
        });
        return;
      }

      if (route.request().method() === "POST") {
        createdRun = route.request().postDataJSON();

        const newRun = {
          id: "run-failed",
          ...createdRun,
          total: 10,
          status: "FAILED",
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        savedRuns.push(newRun);

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newRun),
        });
      }
    });

    await page.goto("/test-runs");

    await page.getByRole("button", { name: "New test run" }).click();

    await page.getByLabel("Run name").fill("Payment failure regression");
    await page.getByLabel("Environment").selectOption("STAGING");
    await page.getByLabel("Passed").fill("7");
    await page.getByLabel("Failed").fill("3");
    await page.getByLabel("Skipped").fill("0");

    await page.getByRole("button", { name: "Save test run" }).click();

    await expect.poll(() => createdRun).not.toBeNull();

    expect(createdRun).toMatchObject({
      name: "Payment failure regression",
      environment: "STAGING",
      passed: 7,
      failed: 3,
      skipped: 0,
    });

    const runsTable = page.getByRole("table");

    await expect(
      runsTable.getByText("Payment failure regression")
    ).toBeVisible();

    await expect(
        runsTable.getByRole("cell", { name: "Failed", exact: true })
    ).toBeVisible();

    await expect(page.getByRole("status")).toContainText(
      "Test run created and saved successfully."
    );
  });

  test("allows a user to create a fully skipped test run", async ({
    page,
  }) => {
    const savedRuns: Record<string, unknown>[] = [];
    let createdRun: Record<string, unknown> | null = null;

    await page.route("**/api/test-runs", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(savedRuns),
        });
        return;
      }

      if (route.request().method() === "POST") {
        createdRun = route.request().postDataJSON();

        const newRun = {
          id: "run-skipped",
          ...createdRun,
          total: 4,
          status: "SKIPPED",
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        savedRuns.push(newRun);

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newRun),
        });
      }
    });

    await page.goto("/test-runs");

    await page.getByRole("button", { name: "New test run" }).click();

    await page.getByLabel("Run name").fill("Maintenance window tests");
    await page.getByLabel("Environment").selectOption("STAGING");
    await page.getByLabel("Passed").fill("0");
    await page.getByLabel("Failed").fill("0");
    await page.getByLabel("Skipped").fill("4");

    await page.getByRole("button", { name: "Save test run" }).click();

    await expect.poll(() => createdRun).not.toBeNull();

    expect(createdRun).toMatchObject({
      name: "Maintenance window tests",
      passed: 0,
      failed: 0,
      skipped: 4,
    });

    const runsTable = page.getByRole("table");

    await expect(
      runsTable.getByText("Maintenance window tests")
    ).toBeVisible();

    await expect(
        runsTable.getByRole("cell", { name: "Skipped", exact: true })
    ).toBeVisible();
  });

  test("allows a user to search and filter test runs", async ({ page }) => {
    await page.route("**/api/test-runs", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(existingRuns),
      });
    });

    await page.goto("/test-runs");

    const runsTable = page.getByRole("table");

    const search = page.getByRole("textbox", {
      name: "Search test runs",
    });

    await search.fill("Checkout");

    await expect(
      runsTable.getByText("Checkout smoke tests")
    ).toBeVisible();

    await expect(
      runsTable.getByText("Login regression suite")
    ).not.toBeVisible();

    await search.clear();

    await page.getByLabel("Filter by status").selectOption("FAILED");

    await expect(
      runsTable.getByText("Login regression suite")
    ).toBeVisible();

    await expect(
      runsTable.getByText("Checkout smoke tests")
    ).not.toBeVisible();
  });

  test("filters partially completed and skipped runs correctly", async ({
    page,
  }) => {
    const runsWithDifferentStatuses = [
      ...existingRuns,
      {
        id: "run-partial",
        name: "Registration regression",
        environment: "DEVELOPMENT",
        passed: 6,
        failed: 0,
        skipped: 2,
        total: 8,
        status: "PARTIAL",
        startedAt: "2026-11-02T10:00:00.000Z",
        completedAt: "2026-11-02T10:05:00.000Z",
      },
      {
        id: "run-skipped",
        name: "Maintenance window tests",
        environment: "STAGING",
        passed: 0,
        failed: 0,
        skipped: 4,
        total: 4,
        status: "SKIPPED",
        startedAt: "2026-11-01T10:00:00.000Z",
        completedAt: "2026-11-01T10:05:00.000Z",
      },
    ];

    await page.route("**/api/test-runs", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(runsWithDifferentStatuses),
      });
    });

    await page.goto("/test-runs");

    const runsTable = page.getByRole("table");
    const statusFilter = page.getByLabel("Filter by status");

    await statusFilter.selectOption("PARTIAL");

    await expect(
      runsTable.getByText("Registration regression")
    ).toBeVisible();

    await expect(
      runsTable.getByText("Maintenance window tests")
    ).not.toBeVisible();

    await statusFilter.selectOption("SKIPPED");

    await expect(
      runsTable.getByText("Maintenance window tests")
    ).toBeVisible();

    await expect(
      runsTable.getByText("Registration regression")
    ).not.toBeVisible();
  });
});