
import { NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

const VALID_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const REQUEST_TIMEOUT = 10_000;
const MAX_REQUEST_SIZE = 100_000;
const MAX_RESPONSE_SIZE = 1_000_000;
const MAX_REDIRECTS = 3;

const blockedIPv4Addresses = new BlockList();
const blockedIPv6Addresses = new BlockList();

const blockedIPv4 = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const;

for (const [address, prefix] of blockedIPv4) {
  blockedIPv4Addresses.addSubnet(address, prefix, "ipv4");
}

const blockedIPv6 = [
  ["::", 128],
  ["::1", 128],
  ["::ffff:0:0", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001:db8::", 32],
  ["2001:2::", 48],
  ["2001:10::", 28],
  ["2001::", 32],
  ["2002::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const;

for (const [address, prefix] of blockedIPv6) {
  blockedIPv6Addresses.addSubnet(address, prefix, "ipv6");
}

function isPublicAddress(address: string): boolean {
  const family = isIP(address);

  if (family === 4) {
    return !blockedIPv4Addresses.check(address, "ipv4");
  }

  if (family === 6) {
    const globalIPv6 = new BlockList();
    globalIPv6.addSubnet("2000::", 3, "ipv6");

    return (
      globalIPv6.check(address, "ipv6") &&
      !blockedIPv6Addresses.check(address, "ipv6")
    );
  }

  return false;
}

async function resolvePublicHost(hostname: string) {
  if (isIP(hostname)) {
    if (!isPublicAddress(hostname)) {
      throw new Error(
        "Requests to private or reserved IP addresses are blocked."
      );
    }

    return [
      {
        address: hostname,
        family: isIP(hostname),
      },
    ];
  }

  const addresses = await lookup(hostname, {
    all: true,
    verbatim: true,
  });

  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => !isPublicAddress(address))
  ) {
    throw new Error(
      "The destination resolves to a private or restricted address."
    );
  }

  return addresses;
}

type RequestResult = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  responseTimeMs: number;
};

async function sendRequest(
  url: URL,
  method: string,
  headers: Record<string, string>,
  body: string
): Promise<{ result: RequestResult; redirect?: string }> {
  const addresses = await resolvePublicHost(url.hostname);
  const target = addresses[0];

  const transport =
    url.protocol === "https:" ? httpsRequest : httpRequest;

  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const outgoing = transport(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method,
        headers: {
          ...headers,
          ...(body && !headers["content-length"]
            ? {
                "content-length": Buffer.byteLength(body).toString(),
              }
            : {}),
        },

        lookup: ((
          _hostname: string,
          options: unknown,
          callback: (
            error: NodeJS.ErrnoException | null,
            address: string | { address: string; family: number }[],
            family?: number
          ) => void
        ) => {
          const resolvedAddress = {
            address: target.address,
            family: target.family,
          };

          if (
            typeof options === "object" &&
            options !== null &&
            "all" in options &&
            options.all === true
          ) {
            callback(null, [resolvedAddress]);
          } else {
            callback(
              null,
              resolvedAddress.address,
              resolvedAddress.family
            );
          }
        }) as never,

        ...(url.protocol === "https:"
          ? { servername: url.hostname }
          : {}),

        agent: false,
      },
      (response) => {
        const status = response.statusCode ?? 0;
        const responseHeaders: Record<string, string> = {};

        for (const [key, value] of Object.entries(response.headers)) {
          if (value !== undefined) {
            responseHeaders[key] = Array.isArray(value)
              ? value.join(", ")
              : String(value);
          }
        }

        const location = response.headers.location;

        if (
          [301, 302, 303, 307, 308].includes(status) &&
          typeof location === "string"
        ) {
          response.resume();

          resolve({
            redirect: location,
            result: {
              status,
              statusText: response.statusMessage ?? "",
              headers: responseHeaders,
              body: "",
              responseTimeMs: Date.now() - startTime,
            },
          });

          return;
        }

        const chunks: Buffer[] = [];
        let totalSize = 0;

        response.on("data", (chunk: Buffer) => {
          totalSize += chunk.length;

          if (totalSize > MAX_RESPONSE_SIZE) {
            outgoing.destroy(
              new Error("Response exceeded the 1 MB size limit.")
            );
            return;
          }

          chunks.push(chunk);
        });

        response.on("end", () => {
          resolve({
            result: {
              status,
              statusText: response.statusMessage ?? "",
              headers: responseHeaders,
              body: Buffer.concat(chunks).toString("utf8"),
              responseTimeMs: Date.now() - startTime,
            },
          });
        });

        response.on("error", reject);
      }
    );

    outgoing.setTimeout(REQUEST_TIMEOUT, () => {
      outgoing.destroy(
        new Error("Request timed out after 10 seconds.")
      );
    });

    outgoing.on("error", reject);

    if (body && !["GET", "HEAD"].includes(method)) {
      outgoing.write(body);
    }

    outgoing.end();
  });
}

async function executeRequest(
  initialUrl: URL,
  initialMethod: string,
  headers: Record<string, string>,
  body: string
): Promise<RequestResult> {
  let currentUrl = initialUrl;
  let currentMethod = initialMethod;
  let currentBody = body;

  for (let attempt = 0; attempt <= MAX_REDIRECTS; attempt++) {
    const { result, redirect } = await sendRequest(
      currentUrl,
      currentMethod,
      headers,
      currentBody
    );

    if (!redirect) return result;

    if (attempt === MAX_REDIRECTS) {
      throw new Error("Maximum redirect limit exceeded.");
    }

    const nextUrl = new URL(redirect, currentUrl);

    if (!["http:", "https:"].includes(nextUrl.protocol)) {
      throw new Error(
        "Redirect to an unsupported protocol was blocked."
      );
    }

    if (nextUrl.username || nextUrl.password) {
      throw new Error(
        "Redirects containing credentials are not allowed."
      );
    }

    if (nextUrl.protocol !== currentUrl.protocol) {
      throw new Error("Cross-protocol redirects are not allowed.");
    }

    if (
      result.status === 303 ||
      ((result.status === 301 || result.status === 302) &&
        currentMethod === "POST")
    ) {
      currentMethod = "GET";
      currentBody = "";
    }

    currentUrl = nextUrl;
  }

  throw new Error("Request could not be completed.");
}

export async function POST(request: NextRequest) {
  // Parse JSON separately so malformed JSON returns HTTP 400.
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  // Ensure the parsed request body is a JSON object.
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  try {
    const {
      method = "GET",
      url,
      headers = {},
      body = "",
    } = payload as Record<string, unknown>;

    if (
      typeof method !== "string" ||
      !VALID_METHODS.includes(method.toUpperCase())
    ) {
      return NextResponse.json(
        { error: "Unsupported HTTP method." },
        { status: 400 }
      );
    }

    if (typeof url !== "string" || url.length > 2048) {
      return NextResponse.json(
        { error: "A valid URL is required." },
        { status: 400 }
      );
    }

    let targetUrl: URL;

    try {
      targetUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL." },
        { status: 400 }
      );
    }

    if (
      !["http:", "https:"].includes(targetUrl.protocol) ||
      targetUrl.username ||
      targetUrl.password
    ) {
      return NextResponse.json(
        {
          error:
            "Only HTTP/HTTPS URLs without embedded credentials are allowed.",
        },
        { status: 400 }
      );
    }

    if (
      headers === null ||
      typeof headers !== "object" ||
      Array.isArray(headers)
    ) {
      return NextResponse.json(
        { error: "Headers must be a JSON object." },
        { status: 400 }
      );
    }

    const requestHeaders: Record<string, string> = {};
    let headerSize = 0;

    const forbiddenHeaders = [
      "host",
      "connection",
      "content-length",
      "transfer-encoding",
      "upgrade",
      "proxy-authorization",
      "proxy-connection",
      "keep-alive",
      "expect",
    ];

    for (const [key, value] of Object.entries(headers)) {
      if (
        typeof value !== "string" ||
        !/^[!#$%&'*+\-.^_`|~0-9a-zA-Z]+$/.test(key) ||
        forbiddenHeaders.includes(key.toLowerCase()) ||
        /[\r\n]/.test(value)
      ) {
        return NextResponse.json(
          { error: `Invalid or restricted header: ${key}` },
          { status: 400 }
        );
      }

      headerSize += key.length + value.length;

      if (headerSize > 16_000) {
        return NextResponse.json(
          { error: "Request headers exceed the 16 KB limit." },
          { status: 400 }
        );
      }

      requestHeaders[key] = value;
    }

    if (
      typeof body !== "string" ||
      Buffer.byteLength(body) > MAX_REQUEST_SIZE
    ) {
      return NextResponse.json(
        { error: "Request body cannot exceed 100 KB." },
        { status: 400 }
      );
    }

    const result = await executeRequest(
      targetUrl,
      method.toUpperCase(),
      requestHeaders,
      body
    );

    return NextResponse.json({
      ...result,
      isJson: (() => {
        try {
          JSON.parse(result.body);
          return true;
        } catch {
          return false;
        }
      })(),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Request execution failed.";

    console.error("API execution failed:", error);

    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
