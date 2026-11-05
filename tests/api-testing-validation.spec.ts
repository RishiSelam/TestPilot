
import { test, expect } from "@playwright/test";

test.describe("API Testing - Request Validation", () => {
  const endpoint = "/api/api-testing/execute";

  test("rejects unsupported HTTP methods", async ({ request }) => {
    const response = await request.post(endpoint, {
      data: {
        method: "TRACE",
        url: "https://jsonplaceholder.typicode.com/posts/1",
      },
    });

    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBe("Unsupported HTTP method.");
  });

  test("rejects non-string HTTP methods", async ({ request }) => {
    const response = await request.post(endpoint, {
      data: {
        method: 123,
        url: "https://jsonplaceholder.typicode.com/posts/1",
      },
    });

    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBe("Unsupported HTTP method.");
  });

  test("rejects malformed URLs", async ({ request }) => {
    const response = await request.post(endpoint, {
      data: {
        method: "GET",
        url: "not-a-valid-url",
      },
    });

    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBe("Invalid URL.");
  });

  test("rejects unsupported URL protocols", async ({ request }) => {
    const response = await request.post(endpoint, {
      data: {
        method: "GET",
        url: "ftp://example.com/file.txt",
      },
    });

    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBe(
      "Only HTTP/HTTPS URLs without embedded credentials are allowed."
    );
  });

  test("rejects URLs containing embedded credentials", async ({ request }) => {
    const response = await request.post(endpoint, {
      data: {
        method: "GET",
        url: "https://username:password@example.com",
      },
    });

    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBe(
      "Only HTTP/HTTPS URLs without embedded credentials are allowed."
    );
  });

  test("rejects headers that are not a JSON object", async ({ request }) => {
    const response = await request.post(endpoint, {
      data: {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/posts/1",
        headers: ["Content-Type", "application/json"],
      },
    });

    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBe("Headers must be a JSON object.");
  });

  test("rejects invalid header names", async ({ request }) => {
    const response = await request.post(endpoint, {
      data: {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/posts/1",
        headers: {
          "Invalid Header": "test",
        },
      },
    });

    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toContain("Invalid or restricted header:");
  });

  test("rejects restricted headers", async ({ request }) => {
    const response = await request.post(endpoint, {
      data: {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/posts/1",
        headers: {
          Host: "malicious.example.com",
        },
      },
    });

    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toContain("Invalid or restricted header:");
  });

  test("rejects CRLF injection in header values", async ({ request }) => {
    const response = await request.post(endpoint, {
      data: {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/posts/1",
        headers: {
          "X-Custom-Header": "test\r\nInjected-Header: malicious",
        },
      },
    });

    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toContain("Invalid or restricted header:");
  });

  test("rejects headers exceeding the size limit", async ({ request }) => {
    const response = await request.post(endpoint, {
      data: {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/posts/1",
        headers: {
          "X-Large-Header": "a".repeat(17 * 1024),
        },
      },
    });

    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBe(
      "Request headers exceed the 16 KB limit."
    );
  });

  test("rejects request bodies exceeding the size limit", async ({ request }) => {
    const response = await request.post(endpoint, {
      data: {
        method: "POST",
        url: "https://jsonplaceholder.typicode.com/posts",
        body: "a".repeat(100_001),
      },
    });

    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBe(
      "Request body cannot exceed 100 KB."
    );
  });

  test("blocks requests to reserved IP addresses", async ({ request }) => {
    const response = await request.post(endpoint, {
      data: {
        method: "GET",
        url: "http://192.0.2.1",
      },
    });

    expect(response.status()).toBe(502);

    const result = await response.json();
    expect(result.error).toContain(
      "Requests to private or reserved IP addresses are blocked."
    );
  });

  test("rejects malformed JSON request bodies", async ({ request }) => {
    const response = await request.post(endpoint, {
      data: Buffer.from("{"),
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBe("Invalid JSON request body.");
  });
});
