
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
    const body = await request.json();

    const {
      title,
      description = "",
      stepsToReproduce = "",
      expectedResult = "",
      actualResult = "",
      severity = "MEDIUM",
      status = "OPEN",
      environment = "DEVELOPMENT",
      testCaseId = null,
      testRunId = null,
    } = body;

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
        { error: "Defect description and reproduction fields must be text." },
        { status: 400 }
      );
    }

    if (!VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json(
        { error: "Invalid defect severity." },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid defect status." },
        { status: 400 }
      );
    }

    if (!VALID_ENVIRONMENTS.includes(environment)) {
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
        description,
        stepsToReproduce,
        expectedResult,
        actualResult,
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
    console.error("Failed to create defect:", error);
    return NextResponse.json(
      { error: "Failed to create defect." },
      { status: 500 }
    );
  }
}
