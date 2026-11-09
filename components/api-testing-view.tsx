
"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Clock3,
  Code2,
  Loader2,
  Play,
  Plus,
  Trash2,
} from "lucide-react";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type HeaderEntry = {
  id: number;
  key: string;
  value: string;
};

type ApiResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  responseTimeMs: number;
  isJson: boolean;
};

type SavedRequest = {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: string;
  body: string;
  updatedAt: string;
};

const methods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const methodStyles: Record<HttpMethod, string> = {
  GET: "text-emerald-500",
  POST: "text-blue-500",
  PUT: "text-orange-500",
  PATCH: "text-violet-500",
  DELETE: "text-red-500",
};

export default function ApiTestingView() {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState(
    "https://jsonplaceholder.typicode.com/posts/1"
  );
  const [headers, setHeaders] = useState<HeaderEntry[]>([
    { id: 1, key: "Accept", value: "application/json" },
  ]);
  const [body, setBody] = useState("");
  const [activeTab, setActiveTab] = useState<"headers" | "body">("headers");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [requestName, setRequestName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedError, setSavedError] = useState("");

  useEffect(() => {
  async function loadSavedRequests() {
    try {
      const response = await fetch("/api/api-requests");

      if (!response.ok) {
        throw new Error("Could not load saved requests.");
      }

      const data = await response.json();
      setSavedRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      setSavedError(
        error instanceof Error ? error.message : "Could not load saved requests."
      );
    }
  }

  loadSavedRequests();
}, []);
async function saveRequest() {
  if (!requestName.trim()) {
    setSavedError("Enter a name for this request.");
    return;
  }

  setSaving(true);
  setSavedError("");

  try {
    const result = await fetch("/api/api-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: requestName.trim(),
        method,
        url,
        headers: JSON.stringify(
        Object.fromEntries(
            headers
            .filter((header) => header.key.trim())
            .map((header) => [header.key.trim(), header.value])
        )
        ),
        body,
      }),
    });

    const data = await result.json();

    if (!result.ok) {
      throw new Error(data.error || "Could not save request.");
    }

    setSavedRequests((current) => [
      data,
      ...current.filter((request) => request.id !== data.id),
    ]);

    setRequestName("");
  } catch (error) {
    setSavedError(
      error instanceof Error ? error.message : "Could not save request."
    );
  } finally {
    setSaving(false);
  }
}

function loadRequest(request: SavedRequest) {
  setMethod(request.method);
  setUrl(request.url);
  setBody(request.body || "");

  try {
    const parsedHeaders = JSON.parse(request.headers || "{}");

    setHeaders(
      Object.entries(parsedHeaders).map(([key, value], index) => ({
        id: Date.now() + index,
        key,
        value: String(value),
      }))
    );
  } catch {
    setHeaders([]);
  }

  setResponse(null);
  setError("");
}

async function deleteRequest(id: string) {
  try {
    const result = await fetch(`/api/api-requests/${id}`, {
      method: "DELETE",
    });

    if (!result.ok) {
      throw new Error("Could not delete saved request.");
    }

    setSavedRequests((current) =>
      current.filter((request) => request.id !== id)
    );
  } catch (error) {
    setSavedError(
      error instanceof Error ? error.message : "Could not delete request."
    );
  }
}
  async function executeRequest() {
    setLoading(true);
    setError("");
    setResponse(null);

    const requestHeaders = Object.fromEntries(
      headers
        .filter((header) => header.key.trim())
        .map((header) => [header.key.trim(), header.value])
    );

    try {
      const result = await fetch("/api/api-testing/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          url,
          headers: requestHeaders,
          body: method === "GET" || method === "DELETE" ? "" : body,
        }),
      });

      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.error || "Request execution failed.");
      }

      setResponse(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateHeader(id: number, field: "key" | "value", value: string) {
    setHeaders((current) =>
      current.map((header) =>
        header.id === id ? { ...header, [field]: value } : header
      )
    );
  }

  function addHeader() {
    setHeaders((current) => [
      ...current,
      { id: Date.now(), key: "", value: "" },
    ]);
  }

  function removeHeader(id: number) {
    setHeaders((current) =>
      current.filter((header) => header.id !== id)
    );
  }

  const formattedResponse = response?.isJson
    ? (() => {
        try {
          return JSON.stringify(JSON.parse(response.body), null, 2);
        } catch {
          return response.body;
        }
      })()
    : response?.body;

  return (
    <main className="min-h-screen bg-background p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Activity size={16} />
            TestPilot / API Testing
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            API Testing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build requests, inspect responses, and manage your API tests.
          </p>
        </div>
        
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Saved requests</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Your reusable API request collection.
              </p>
            </div>
            <span className="rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {savedRequests.length} saved
            </span>
          </div>

          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={requestName}
              onChange={(event) => setRequestName(event.target.value)}
              placeholder="Name this request..."
              className="h-10 min-w-0 flex-1 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
            <button
              onClick={saveRequest}
              disabled={saving || !requestName.trim()}
              className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save request"}
            </button>
          </div>

          {savedError && (
            <p className="mb-3 text-sm text-red-500">{savedError}</p>
          )}

          {savedRequests.length === 0 ? (
            <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
              No saved requests yet. Name and save your first request.
            </p>
          ) : (
            <div className="space-y-2">
              {savedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-background/50 p-3 transition-all duration-200 hover:border-border hover:bg-muted/20 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {request.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      <span className={methodStyles[request.method]}>
                        {request.method}
                      </span>
                      {" · "}
                      {request.url}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => loadRequest(request)}
                      className="rounded-lg border border-border/70 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteRequest(request.id)}
                      aria-label={`Delete ${request.name}`}
                      className="rounded-lg p-2 text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
            <select
              value={method}
              onChange={(event) =>
                setMethod(event.target.value as HttpMethod)
              }
              className={`h-11 rounded-xl border border-border/70 bg-background px-3 text-sm font-bold outline-none ${methodStyles[method]}`}
              aria-label="HTTP method"
            >
              {methods.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !loading) {
                  executeRequest();
                }
              }}
              placeholder="Enter request URL"
              className="h-11 min-w-0 flex-1 rounded-xl border border-border/70 bg-background px-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              aria-label="Request URL"
            />

            <button
              onClick={executeRequest}
              disabled={loading || !url.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              {loading ? "Sending..." : "Send"}
            </button>
          </div>

          <div className="border-b">
            <div className="flex gap-5 px-5">
              <button
                onClick={() => setActiveTab("headers")}
                className={`border-b-2 py-3 text-sm font-medium transition-all duration-200 ${
                  activeTab === "headers"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                Headers ({headers.filter((h) => h.key.trim()).length})
              </button>
              <button
                onClick={() => setActiveTab("body")}
                className={`border-b-2 py-3 text-sm font-medium transition-all duration-200 ${
                  activeTab === "body"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                Body
              </button>
            </div>
          </div>

          <div className="min-h-64 p-5">
            {activeTab === "headers" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_1fr_40px] gap-2 text-xs font-medium text-muted-foreground">
                  <span>KEY</span>
                  <span>VALUE</span>
                  <span />
                </div>

                {headers.map((header) => (
                  <div
                    key={header.id}
                    className="grid grid-cols-[1fr_1fr_40px] gap-2"
                  >
                    <input
                      value={header.key}
                      onChange={(event) =>
                        updateHeader(header.id, "key", event.target.value)
                      }
                      placeholder="Header name"
                      className="h-10 min-w-0 rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring"
                    />
                    <input
                      value={header.value}
                      onChange={(event) =>
                        updateHeader(header.id, "value", event.target.value)
                      }
                      placeholder="Header value"
                      className="h-10 min-w-0 rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring"
                    />
                    <button
                      onClick={() => removeHeader(header.id)}
                      className="flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
                      aria-label="Remove header"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addHeader}
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Plus className="size-4" />
                  Add header
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Code2 className="size-4" />
                  Request body
                </div>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={'{\n  "title": "Test request",\n  "body": "Hello API"\n}'}
                  spellCheck={false}
                  className="min-h-52 w-full resize-y rounded-xl border border-border/70 bg-background p-4 font-mono text-sm outline-none focus:border-ring"
                />
              </div>
            )}
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold">Response</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                The server response will appear here.
              </p>
            </div>

            {response && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span
                  className={`rounded-lg px-2.5 py-1.5 font-semibold ${
                    response.status >= 200 && response.status < 300
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {response.status} {response.statusText}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock3 className="size-3.5" />
                  {response.responseTimeMs} ms
                </span>
                <span className="text-muted-foreground">
                  {new Blob([response.body]).size} B
                </span>
              </div>
            )}
          </div>

          <div className="min-h-64 p-5">
            {loading ? (
              <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
                <p className="text-sm">Executing API request...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
                {error}
              </div>
            ) : response ? (
              <pre className="max-h-[500px] overflow-auto rounded-xl bg-muted/40 p-4 font-mono text-xs leading-6">
                {formattedResponse}
              </pre>
            ) : (
              <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                  <Code2 className="size-5" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  No response yet
                </p>
                <p className="max-w-sm text-xs">
                  Configure your request and press Send to inspect the API response.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
