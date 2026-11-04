
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isValidUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;

  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isValidHeaders(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const parsed = JSON.parse(value);

    return (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      Object.values(parsed).every(
        (headerValue) => typeof headerValue === "string"
      )
    );
  } catch {
    return false;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const savedRequest = await prisma.apiRequest.findUnique({
      where: { id },
    });

    if (!savedRequest) {
      return NextResponse.json(
        { error: "API request not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(savedRequest);
  } catch (error) {
    console.error("Failed to fetch API request:", error);

    return NextResponse.json(
      { error: "Failed to fetch API request." },
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

    const existingRequest = await prisma.apiRequest.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "API request not found." },
        { status: 404 }
      );
    }

    const allowedFields = ["name", "method", "url", "headers", "body"];

    const unknownFields = Object.keys(body).filter(
      (field) => !allowedFields.includes(field)
    );

    if (unknownFields.length > 0) {
      return NextResponse.json(
        { error: `Unknown fields: ${unknownFields.join(", ")}` },
        { status: 400 }
      );
    }

    const data: {
      name?: string;
      method?: string;
      url?: string;
      headers?: string;
      body?: string;
    } = {};

    if ("name" in body) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.trim().length > 100
      ) {
        return NextResponse.json(
          { error: "Name is required and cannot exceed 100 characters." },
          { status: 400 }
        );
      }

      data.name = body.name.trim();
    }

    if ("method" in body) {
      if (
        typeof body.method !== "string" ||
        !VALID_METHODS.includes(body.method.toUpperCase())
      ) {
        return NextResponse.json(
          { error: "Invalid HTTP method." },
          { status: 400 }
        );
      }

      data.method = body.method.toUpperCase();
    }

    if ("url" in body) {
      if (!isValidUrl(body.url)) {
        return NextResponse.json(
          { error: "A valid HTTP or HTTPS URL is required." },
          { status: 400 }
        );
      }

      data.url = body.url.trim();
    }

    if ("headers" in body) {
      if (!isValidHeaders(body.headers)) {
        return NextResponse.json(
          { error: "Headers must be a valid JSON object containing text values." },
          { status: 400 }
        );
      }

      data.headers = body.headers;
    }

    if ("body" in body) {
      if (typeof body.body !== "string" || body.body.length > 100_000) {
        return NextResponse.json(
          { error: "Request body must be text and cannot exceed 100 KB." },
          { status: 400 }
        );
      }

      data.body = body.body;
    }

    const updatedRequest = await prisma.apiRequest.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Failed to update API request:", error);

    return NextResponse.json(
      { error: "Failed to update API request." },
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

    const existingRequest = await prisma.apiRequest.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "API request not found." },
        { status: 404 }
      );
    }

    await prisma.apiRequest.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "API request deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete API request:", error);

    return NextResponse.json(
      { error: "Failed to delete API request." },
      { status: 500 }
    );
  }
}
