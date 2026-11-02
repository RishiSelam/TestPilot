
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const VALID_ENVIRONMENTS = ["DEVELOPMENT", "STAGING", "PRODUCTION"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const defect = await prisma.defect.findUnique({
      where: { id },
      include: {
        testCase: {
          select: { id: true, title: true },
        },
        testRun: {
          select: { id: true, name: true },
        },
      },
    });

    if (!defect) {
      return NextResponse.json(
        { error: "Defect not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(defect);
  } catch (error) {
    console.error("Failed to fetch defect:", error);
    return NextResponse.json(
      { error: "Failed to fetch defect." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingDefect = await prisma.defect.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingDefect) {
      return NextResponse.json(
        { error: "Defect not found." },
        { status: 404 }
      );
    }

    const allowedFields = [
      "title",
      "description",
      "stepsToReproduce",
      "expectedResult",
      "actualResult",
      "severity",
      "status",
      "environment",
      "testCaseId",
      "testRunId",
    ];

    const unknownFields = Object.keys(body).filter(
      (field) => !allowedFields.includes(field)
    );

    if (unknownFields.length > 0) {
      return NextResponse.json(
        { error: `Unknown fields: ${unknownFields.join(", ")}` },
        { status: 400 }
      );
    }

    const data: Record<string, string | null> = {};

    const textFields = [
      "title",
      "description",
      "stepsToReproduce",
      "expectedResult",
      "actualResult",
    ];

    for (const field of textFields) {
      if (field in body) {
        if (typeof body[field] !== "string") {
          return NextResponse.json(
            { error: `${field} must be text.` },
            { status: 400 }
          );
        }

        if (field === "title" && !body[field].trim()) {
          return NextResponse.json(
            { error: "Title cannot be empty." },
            { status: 400 }
          );
        }

        data[field] =
          field === "title" ? body[field].trim() : body[field];
      }
    }

    if ("severity" in body) {
      if (!VALID_SEVERITIES.includes(body.severity)) {
        return NextResponse.json(
          { error: "Invalid defect severity." },
          { status: 400 }
        );
      }
      data.severity = body.severity;
    }

    if ("status" in body) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid defect status." },
          { status: 400 }
        );
      }
      data.status = body.status;
    }

    if ("environment" in body) {
      if (!VALID_ENVIRONMENTS.includes(body.environment)) {
        return NextResponse.json(
          { error: "Invalid environment." },
          { status: 400 }
        );
      }
      data.environment = body.environment;
    }

    for (const field of ["testCaseId", "testRunId"]) {
      if (field in body) {
        const value = body[field];

        if (value !== null && typeof value !== "string") {
          return NextResponse.json(
            { error: `${field} must be a string or null.` },
            { status: 400 }
          );
        }

        data[field] = value;
      }
    }

    if (data.testCaseId) {
      const testCase = await prisma.testCase.findUnique({
        where: { id: data.testCaseId },
        select: { id: true },
      });

      if (!testCase) {
        return NextResponse.json(
          { error: "Referenced test case was not found." },
          { status: 404 }
        );
      }
    }

    if (data.testRunId) {
      const testRun = await prisma.testRun.findUnique({
        where: { id: data.testRunId },
        select: { id: true },
      });

      if (!testRun) {
        return NextResponse.json(
          { error: "Referenced test run was not found." },
          { status: 404 }
        );
      }
    }

    const updatedDefect = await prisma.defect.update({
      where: { id },
      data,
      include: {
        testCase: {
          select: { id: true, title: true },
        },
        testRun: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(updatedDefect);
  } catch (error) {
    console.error("Failed to update defect:", error);
    return NextResponse.json(
      { error: "Failed to update defect." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const existingDefect = await prisma.defect.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingDefect) {
      return NextResponse.json(
        { error: "Defect not found." },
        { status: 404 }
      );
    }

    await prisma.defect.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Defect deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete defect:", error);
    return NextResponse.json(
      { error: "Failed to delete defect." },
      { status: 500 }
    );
  }
}
