
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const VALID_ENVIRONMENTS = ["DEVELOPMENT", "STAGING", "PRODUCTION"] as const;

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

    const unknownFields = Object.keys(input).filter(
      (field) => !allowedFields.includes(field)
    );

    if (unknownFields.length > 0) {
      return NextResponse.json(
        { error: `Unknown fields: ${unknownFields.join(", ")}` },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};

    const textFields = [
      "title",
      "description",
      "stepsToReproduce",
      "expectedResult",
      "actualResult",
    ] as const;

    for (const field of textFields) {
      if (field in input) {
        const value = input[field];

        if (typeof value !== "string") {
          return NextResponse.json(
            { error: `${field} must be text.` },
            { status: 400 }
          );
        }

        if (field === "title" && !value.trim()) {
          return NextResponse.json(
            { error: "Title cannot be empty." },
            { status: 400 }
          );
        }

        data[field] =
          field === "title" ? value.trim() : value;
      }
    }

    if ("severity" in input) {
      const value = input.severity;

      if (
        typeof value !== "string" ||
        !VALID_SEVERITIES.includes(
          value as (typeof VALID_SEVERITIES)[number]
        )
      ) {
        return NextResponse.json(
          { error: "Invalid defect severity." },
          { status: 400 }
        );
      }

      data.severity = value;
    }

    if ("status" in input) {
      const value = input.status;

      if (
        typeof value !== "string" ||
        !VALID_STATUSES.includes(
          value as (typeof VALID_STATUSES)[number]
        )
      ) {
        return NextResponse.json(
          { error: "Invalid defect status." },
          { status: 400 }
        );
      }

      data.status = value;
    }

    if ("environment" in input) {
      const value = input.environment;

      if (
        typeof value !== "string" ||
        !VALID_ENVIRONMENTS.includes(
          value as (typeof VALID_ENVIRONMENTS)[number]
        )
      ) {
        return NextResponse.json(
          { error: "Invalid environment." },
          { status: 400 }
        );
      }

      data.environment = value;
    }

    for (const field of ["testCaseId", "testRunId"] as const) {
      if (field in input) {
        const value = input[field];

        if (value !== null && typeof value !== "string") {
          return NextResponse.json(
            { error: `${field} must be a string or null.` },
            { status: 400 }
          );
        }

        if (value !== null) {
          const relatedRecord =
            field === "testCaseId"
              ? await prisma.testCase.findUnique({
                  where: { id: value },
                  select: { id: true },
                })
              : await prisma.testRun.findUnique({
                  where: { id: value },
                  select: { id: true },
                });

          if (!relatedRecord) {
            return NextResponse.json(
              {
                error: `The referenced ${field === "testCaseId" ? "test case" : "test run"} does not exist.`,
              },
              { status: 404 }
            );
          }
        }

        data[field] = value;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Provide at least one field to update." },
        { status: 400 }
      );
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
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body contains invalid JSON." },
        { status: 400 }
      );
    }

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
