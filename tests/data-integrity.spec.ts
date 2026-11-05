
import { expect, test } from "@playwright/test";

const API = "http://localhost:3000/api";

test.describe("Database relationship integrity", () => {
  test("preserves a defect when its linked test case is deleted", async ({
    request,
  }) => {
    const unique = Date.now();
    let testCaseId: string | undefined;
    let defectId: string | undefined;

    try {
      const testCaseResponse = await request.post(`${API}/test-cases`, {
        data: {
          title: `Integrity test case ${unique}`,
          description: "Created by the database integrity test.",
          steps: "1. Open the application.",
          expected: "The application loads.",
          priority: "HIGH",
          status: "READY",
        },
      });

      expect(testCaseResponse.status()).toBe(201);

      const testCase = await testCaseResponse.json();
      testCaseId = testCase.id;

      const defectResponse = await request.post(`${API}/defects`, {
        data: {
          title: `Integrity test defect ${unique}`,
          description: "Checking SetNull relationship behavior.",
          severity: "HIGH",
          status: "OPEN",
          environment: "DEVELOPMENT",
          testCaseId: testCase.id,
        },
      });

      expect(defectResponse.status()).toBe(201);

      const defect = await defectResponse.json();
      defectId = defect.id;

      expect(defect.testCaseId).toBe(testCase.id);
      expect(defect.testCase.id).toBe(testCase.id);

      const deleteResponse = await request.delete(
        `${API}/test-cases/${testCase.id}`
      );

      expect(deleteResponse.status()).toBe(200);

      const remainingDefectResponse = await request.get(
        `${API}/defects/${defect.id}`
      );

      expect(remainingDefectResponse.status()).toBe(200);

      const remainingDefect = await remainingDefectResponse.json();

      expect(remainingDefect.id).toBe(defect.id);
      expect(remainingDefect.testCaseId).toBeNull();
      expect(remainingDefect.testCase).toBeNull();
    } finally {
      if (defectId) {
        await request.delete(`${API}/defects/${defectId}`);
      }

      if (testCaseId) {
        await request.delete(`${API}/test-cases/${testCaseId}`);
      }
    }
  });

  test("rejects a defect linked to a nonexistent test case", async ({
    request,
  }) => {
    const response = await request.post(`${API}/defects`, {
      data: {
        title: `Invalid relationship ${Date.now()}`,
        testCaseId: "nonexistent-test-case-id",
      },
    });

    expect(response.status()).toBe(404);
  });

  test("rejects a defect update linked to a nonexistent test run", async ({
    request,
  }) => {
    let defectId: string | undefined;

    try {
      const createResponse = await request.post(`${API}/defects`, {
        data: {
          title: `Test run validation ${Date.now()}`,
        },
      });

      expect(createResponse.status()).toBe(201);

      const defect = await createResponse.json();
      defectId = defect.id;

      const updateResponse = await request.patch(
        `${API}/defects/${defect.id}`,
        {
          data: {
            testRunId: "nonexistent-test-run-id",
          },
        }
      );

      expect(updateResponse.status()).toBe(404);

      const verifyResponse = await request.get(
        `${API}/defects/${defect.id}`
      );

      expect(verifyResponse.status()).toBe(200);

      const unchangedDefect = await verifyResponse.json();

      expect(unchangedDefect.testRunId).toBeNull();
    } finally {
      if (defectId) {
        await request.delete(`${API}/defects/${defectId}`);
      }
    }
  });
});
