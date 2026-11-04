
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

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

function isValidUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;

  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const requests = await prisma.apiRequest.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to fetch API requests:", error);

    return NextResponse.json(
      { error: "Failed to fetch saved API requests." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      method = "GET",
      url,
      headers = "{}",
      body: requestBody = "",
    } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100
    ) {
      return NextResponse.json(
        { error: "A request name is required (maximum 100 characters)." },
        { status: 400 }
      );
    }

    if (
      typeof method !== "string" ||
      !VALID_METHODS.includes(method.toUpperCase())
    ) {
      return NextResponse.json(
        { error: "Invalid HTTP method." },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: "A valid HTTP or HTTPS URL is required." },
        { status: 400 }
      );
    }

    if (!isValidHeaders(headers)) {
      return NextResponse.json(
        { error: "Headers must be a valid JSON object containing text values." },
        { status: 400 }
      );
    }

    if (typeof requestBody !== "string" || requestBody.length > 100_000) {
      return NextResponse.json(
        { error: "Request body must be text and cannot exceed 100 KB." },
        { status: 400 }
      );
    }

    const savedRequest = await prisma.apiRequest.create({
      data: {
        name: name.trim(),
        method: method.toUpperCase(),
        url: url.trim(),
        headers,
        body: requestBody,
      },
    });

    return NextResponse.json(savedRequest, { status: 201 });
  } catch (error) {
    console.error("Failed to create API request:", error);

    return NextResponse.json(
      { error: "Failed to save API request." },
      { status: 500 }
    );
  }
}
