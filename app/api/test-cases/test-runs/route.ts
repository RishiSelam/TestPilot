
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const validEnvironments = ["DEVELOPMENT", "STAGING", "PRODUCTION"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// GET /api/test-runs
export async function GET() {
  try {
    const testRuns = await prisma.testRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 100,
    });

    return NextResponse.json(testRuns, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch test runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch test runs." },
      { status: 500 }
    );
  }
}

// POST /api/test-runs
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Request body must be a JSON object." },
        { status: 400 }
      );
    }

    const { name, environment, passed, failed, skipped } = body;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Run name is required." },
        { status: 400 }
      );
    }

    if (
      typeof environment !== "string" ||
      !validEnvironments.includes(environment.toUpperCase())
    ) {
      return NextResponse.json(
        { error: "Environment must be Development, Staging, or Production." },
        { status: 400 }
      );
    }

    const counts: unknown[] = [passed, failed, skipped];

    if (
      !counts.every(
        (count) =>
          typeof count === "number" &&
          Number.isSafeInteger(count) &&
          count >= 0
      )
    ) {
      return NextResponse.json(
        { error: "Passed, failed, and skipped must be non-negative integers." },
        { status: 400 }
      );
    }

    // Explicit narrowing after validation.
    const passedCount = passed as number;
    const failedCount = failed as number;
    const skippedCount = skipped as number;
    const total = passedCount + failedCount + skippedCount;

    if (!Number.isSafeInteger(total) || total < 1) {
      return NextResponse.json(
        { error: "A test run must contain at least one test." },
        { status: 400 }
      );
    }

    const testRun = await prisma.testRun.create({
      data: {
        name: name.trim(),
        environment: environment.toUpperCase(),
        passed: passedCount,
        failed: failedCount,
        skipped: skippedCount,
        total,
        status: failedCount > 0 ? "FAILED" : "PASSED",
        completedAt: new Date(),
      },
    });

    return NextResponse.json(testRun, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body contains invalid JSON." },
        { status: 400 }
      );
    }

    console.error("Failed to create test run:", error);
    return NextResponse.json(
      { error: "Failed to create test run." },
      { status: 500 }
    );
  }
}
