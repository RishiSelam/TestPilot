
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// GET /api/test-cases
export async function GET() {
  try {
    const testCases = await prisma.testCase.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(testCases, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch test cases:", error);

    return NextResponse.json(
      { error: "Failed to fetch test cases." },
      { status: 500 }
    );
  }
}

// POST /api/test-cases
export async function POST(request: Request) {
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

    const data = body as Record<string, unknown>;

    const { title, description, steps, expected, priority, status } = data;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      typeof steps !== "string" ||
      typeof expected !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Title, description, steps, and expected must be strings. Title cannot be empty.",
        },
        { status: 400 }
      );
    }

    const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const validStatuses = ["DRAFT", "READY", "BLOCKED"];

    if (
      priority !== undefined &&
      (typeof priority !== "string" ||
        !validPriorities.includes(priority.toUpperCase()))
    ) {
      return NextResponse.json(
        { error: "Invalid priority." },
        { status: 400 }
      );
    }

    if (
      status !== undefined &&
      (typeof status !== "string" ||
        !validStatuses.includes(status.toUpperCase()))
    ) {
      return NextResponse.json(
        { error: "Invalid status." },
        { status: 400 }
      );
    }

    const testCase = await prisma.testCase.create({
      data: {
        title: title.trim(),
        description,
        steps,
        expected,
        priority:
          typeof priority === "string"
            ? priority.toUpperCase()
            : "MEDIUM",
        status:
          typeof status === "string"
            ? status.toUpperCase()
            : "DRAFT",
      },
    });

    return NextResponse.json(testCase, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body contains invalid JSON." },
        { status: 400 }
      );
    }

    console.error("Failed to create test case:", error);

    return NextResponse.json(
      { error: "Failed to create test case." },
      { status: 500 }
    );
  }
}
