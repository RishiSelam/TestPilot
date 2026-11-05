
import { test, expect } from "@playwright/test";

test.describe("API Testing", () => {
  test("displays the API Testing interface", async ({ page }) => {
    await page.goto("/api-testing");

    await expect(
      page.getByRole("heading", { name: "API Testing" })
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Saved requests" })
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Send" })
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Response" })
    ).toBeVisible();
  });

  test("saves a request and displays it in saved requests", async ({
    page,
  }) => {
    await page.goto("/api-testing");

    const requestName = `Playwright Save Test ${Date.now()}`;

    await page.getByPlaceholder("Name this request...").fill(requestName);
    await page.getByRole("button", { name: "Save request" }).click();

    const savedRequest = page
      .locator("div.flex.flex-col.justify-between.gap-3.rounded-xl.border")
      .filter({
        has: page.getByText(requestName, { exact: true }),
      });

    await expect(savedRequest).toBeVisible();

    await expect(
      savedRequest.getByRole("button", {
        name: "Load",
        exact: true,
      })
    ).toBeVisible();

    await expect(
      savedRequest.getByRole("button", {
        name: `Delete ${requestName}`,
      })
    ).toBeVisible();
  });

  test("loads a saved request into the request builder", async ({
    page,
  }) => {
    await page.goto("/api-testing");

    const requestName = `Playwright Load Test ${Date.now()}`;
    const requestUrl = "https://jsonplaceholder.typicode.com/posts";

    await page.getByPlaceholder("Name this request...").fill(requestName);

    await page
      .getByRole("combobox", { name: "HTTP method" })
      .selectOption("POST");

    await page.getByLabel("Request URL").fill(requestUrl);

    await page.getByRole("button", { name: "Body" }).click();

    const requestBody = JSON.stringify({
      title: "Playwright test",
      body: "Testing saved request loading",
      userId: 1,
    });

    await page.locator("textarea").fill(requestBody);

    await page.getByRole("button", { name: "Save request" }).click();

    const savedRequest = page
      .locator("div.flex.flex-col.justify-between.gap-3.rounded-xl.border")
      .filter({
        has: page.getByText(requestName, { exact: true }),
      });

    await expect(savedRequest).toBeVisible();

    await savedRequest
      .getByRole("button", {
        name: "Load",
        exact: true,
      })
      .click();

    await expect(
      page.getByRole("combobox", { name: "HTTP method" })
    ).toHaveValue("POST");

    await expect(page.getByLabel("Request URL")).toHaveValue(requestUrl);

    await expect(page.locator("textarea")).toContainText(
      "Testing saved request loading"
    );
  });

  test("deletes a saved request", async ({ page }) => {
    await page.goto("/api-testing");

    const requestName = `Playwright Delete Test ${Date.now()}`;

    await page.getByPlaceholder("Name this request...").fill(requestName);

    await page.getByRole("button", { name: "Save request" }).click();

    const savedRequest = page
      .locator("div.flex.flex-col.justify-between.gap-3.rounded-xl.border")
      .filter({
        has: page.getByText(requestName, { exact: true }),
      });

    await expect(savedRequest).toBeVisible();

    await savedRequest
      .getByRole("button", {
        name: `Delete ${requestName}`,
      })
      .click();

    await expect(savedRequest).not.toBeVisible();
  });

  test("executes a GET request and displays its response", async ({
    page,
  }) => {
    await page.goto("/api-testing");

    // Uses the default JSONPlaceholder GET endpoint.
    // This is a real server-side request, not a browser route mock.
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText("200 OK")).toBeVisible({
      timeout: 20_000,
    });

    await expect(page.locator("pre")).toContainText('"userId": 1');
    await expect(page.locator("pre")).toContainText('"id": 1');
  });

  test("blocks requests to private localhost addresses", async ({
    page,
  }) => {
    await page.goto("/api-testing");

    await page.getByLabel("Request URL").fill("http://127.0.0.1:3000");

    await page.getByRole("button", { name: "Send" }).click();

    await expect(
      page.getByText(/private or reserved IP addresses are blocked/i)
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test("disables saving when the request name is empty", async ({
    page,
  }) => {
    await page.goto("/api-testing");

    const nameInput = page.getByPlaceholder("Name this request...");
    const saveButton = page.getByRole("button", { name: "Save request" });

    await expect(saveButton).toBeDisabled();

    await nameInput.fill("   ");

    await expect(saveButton).toBeDisabled();

    await nameInput.fill("Valid request name");

    await expect(saveButton).toBeEnabled();
  });
});
