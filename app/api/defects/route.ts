
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const VALID_ENVIRONMENTS = ["DEVELOPMENT", "STAGING", "PRODUCTION"];

export async function GET() {
  try {
    const defects = await prisma.defect.findMany({
      include: {
        testCase: {
          select: { id: true, title: true },
        },
        testRun: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(defects);
  } catch (error) {
    console.error("Failed to fetch defects:", error);

    return NextResponse.json(
      { error: "Failed to fetch defects." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Request body must be a JSON object." },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;

    const {
      title,
      severity = "MEDIUM",
      status = "OPEN",
      environment = "DEVELOPMENT",
      testCaseId = null,
      testRunId = null,
    } = input;

    const description =
      input.description === undefined ? "" : input.description;

    const stepsToReproduce =
      input.stepsToReproduce === undefined
        ? ""
        : input.stepsToReproduce;

    const expectedResult =
      input.expectedResult === undefined ? "" : input.expectedResult;

    const actualResult =
      input.actualResult === undefined ? "" : input.actualResult;

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "A defect title is required." },
        { status: 400 }
      );
    }

    const textFields = [
      description,
      stepsToReproduce,
      expectedResult,
      actualResult,
    ];

    if (textFields.some((value) => typeof value !== "string")) {
      return NextResponse.json(
        {
          error:
            "Defect description and reproduction fields must be text.",
        },
        { status: 400 }
      );
    }

    if (
      typeof severity !== "string" ||
      !VALID_SEVERITIES.includes(severity)
    ) {
      return NextResponse.json(
        { error: "Invalid defect severity." },
        { status: 400 }
      );
    }

    if (
      typeof status !== "string" ||
      !VALID_STATUSES.includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid defect status." },
        { status: 400 }
      );
    }

    if (
      typeof environment !== "string" ||
      !VALID_ENVIRONMENTS.includes(environment)
    ) {
      return NextResponse.json(
        { error: "Invalid environment." },
        { status: 400 }
      );
    }

    if (
      (testCaseId !== null && typeof testCaseId !== "string") ||
      (testRunId !== null && typeof testRunId !== "string")
    ) {
      return NextResponse.json(
        { error: "Invalid test case or test run reference." },
        { status: 400 }
      );
    }

    if (testCaseId) {
      const testCase = await prisma.testCase.findUnique({
        where: { id: testCaseId },
        select: { id: true },
      });

      if (!testCase) {
        return NextResponse.json(
          { error: "Referenced test case was not found." },
          { status: 404 }
        );
      }
    }

    if (testRunId) {
      const testRun = await prisma.testRun.findUnique({
        where: { id: testRunId },
        select: { id: true },
      });

      if (!testRun) {
        return NextResponse.json(
          { error: "Referenced test run was not found." },
          { status: 404 }
        );
      }
    }

    const defect = await prisma.defect.create({
      data: {
        title: title.trim(),
        description: description as string,
        stepsToReproduce: stepsToReproduce as string,
        expectedResult: expectedResult as string,
        actualResult: actualResult as string,
        severity,
        status,
        environment,
        testCaseId,
        testRunId,
      },
      include: {
        testCase: {
          select: { id: true, title: true },
        },
        testRun: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(defect, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body contains invalid JSON." },
        { status: 400 }
      );
    }

    console.error("Failed to create defect:", error);

    return NextResponse.json(
      { error: "Failed to create defect." },
      { status: 500 }
    );
  }
}
