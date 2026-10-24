
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const validStatuses = ["DRAFT", "READY", "BLOCKED"];

// PATCH /api/test-cases/:id
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
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
    const data: Record<string, string> = {};

    const stringFields = [
      "title",
      "description",
      "steps",
      "expected",
    ] as const;

    for (const field of stringFields) {
      if (field in input) {
        if (
          typeof input[field] !== "string" ||
          (field === "title" && !input[field].trim())
        ) {
          return NextResponse.json(
            { error: `Invalid value for ${field}.` },
            { status: 400 }
          );
        }

        data[field] =
          field === "title"
            ? (input[field] as string).trim()
            : (input[field] as string);
      }
    }

    if ("priority" in input) {
      if (
        typeof input.priority !== "string" ||
        !validPriorities.includes(input.priority.toUpperCase())
      ) {
        return NextResponse.json(
          { error: "Invalid priority." },
          { status: 400 }
        );
      }

      data.priority = input.priority.toUpperCase();
    }

    if ("status" in input) {
      if (
        typeof input.status !== "string" ||
        !validStatuses.includes(input.status.toUpperCase())
      ) {
        return NextResponse.json(
          { error: "Invalid status." },
          { status: 400 }
        );
      }

      data.status = input.status.toUpperCase();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Provide at least one field to update." },
        { status: 400 }
      );
    }

    const testCase = await prisma.testCase.update({
      where: { id },
      data,
    });

    return NextResponse.json(testCase, { status: 200 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body contains invalid JSON." },
        { status: 400 }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Test case not found." },
        { status: 404 }
      );
    }

    console.error("Failed to update test case:", error);

    return NextResponse.json(
      { error: "Failed to update test case." },
      { status: 500 }
    );
  }
}

// DELETE /api/test-cases/:id
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    await prisma.testCase.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Test case deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Test case not found." },
        { status: 404 }
      );
    }

    console.error("Failed to delete test case:", error);

    return NextResponse.json(
      { error: "Failed to delete test case." },
      { status: 500 }
    );
  }
}
