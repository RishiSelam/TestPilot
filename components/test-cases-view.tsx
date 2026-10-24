
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ClipboardList,
  X,
} from "lucide-react";

type Priority = "Low" | "Medium" | "High" | "Critical";
type Status = "Draft" | "Ready" | "Blocked";

type TestCase = {
  id: string;
  title: string;
  description: string;
  steps: string;
  expected: string;
  priority: Priority;
  status: Status;
  createdAt: string;
};

type TestCaseForm = Omit<TestCase, "id" | "createdAt">;

const emptyForm: TestCaseForm = {
  title: "",
  description: "",
  steps: "",
  expected: "",
  priority: "Medium",
  status: "Draft",
};

function normalizeCase(data: Record<string, unknown>): TestCase {
  const priority = String(data.priority ?? "MEDIUM").toUpperCase();
  const status = String(data.status ?? "DRAFT").toUpperCase();

  const normalizedPriority: Priority =
    priority === "LOW" ? "Low"
    : priority === "HIGH" ? "High"
    : priority === "CRITICAL" ? "Critical"
    : "Medium";

  const normalizedStatus: Status =
    status === "READY" || status === "ACTIVE" ? "Ready"
    : status === "BLOCKED" || status === "ARCHIVED" ? "Blocked"
    : "Draft";

  return {
    id: String(data.id ?? ""),
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    steps: String(data.steps ?? ""),
    expected: String(data.expected ?? ""),
    priority: normalizedPriority,
    status: normalizedStatus,
    createdAt: String(data.createdAt ?? new Date().toISOString()),
  };
}

async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : `Request failed (${response.status}).`
    );
  }

  return data as T;
}

export default function TestCasesView() {
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TestCaseForm>(emptyForm);

  async function loadCases() {
    setLoaded(false);
    setLoadingError("");

    try {
      const data = await apiRequest<Record<string, unknown>[]>(
        "/api/test-cases"
      );
      setCases(data.map(normalizeCase));
    } catch (error) {
      setLoadingError(
        error instanceof Error ? error.message : "Could not load test cases."
      );
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    void loadCases();
  }, []);

  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const matchesSearch = [
        item.id,
        item.title,
        item.description,
        item.expected,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      return (
        matchesSearch &&
        (priorityFilter === "All" || item.priority === priorityFilter) &&
        (statusFilter === "All" || item.status === statusFilter)
      );
    });
  }, [cases, search, priorityFilter, statusFilter]);

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setActionError("");
    setShowForm(true);
  }

  function openEditForm(item: TestCase) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      steps: item.steps,
      expected: item.expected,
      priority: item.priority,
      status: item.status,
    });
    setActionError("");
    setShowForm(true);
  }

  async function saveCase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    if (!title || saving) return;

    setSaving(true);
    setActionError("");

    const payload = {
      ...form,
      title,
      priority: form.priority.toUpperCase(),
      status: form.status.toUpperCase(),
    };

    try {
      if (editingId) {
        const updated = await apiRequest<Record<string, unknown>>(
          `/api/test-cases/${encodeURIComponent(editingId)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        );

        const normalized = normalizeCase(updated);
        setCases((current) =>
          current.map((item) =>
            item.id === editingId ? normalized : item
          )
        );
      } else {
        const created = await apiRequest<Record<string, unknown>>(
          "/api/test-cases",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        setCases((current) => [normalizeCase(created), ...current]);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not save the test case."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCase(id: string) {
    if (
      !window.confirm("Delete this test case? This cannot be undone.") ||
      deletingId
    ) {
      return;
    }

    setDeletingId(id);
    setActionError("");

    try {
      await apiRequest<{ message: string }>(
        `/api/test-cases/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );

      setCases((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not delete the test case."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30";
  const labelClass = "text-sm font-medium";

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Test case library
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and organize the checks that keep your product reliable.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          New test case
        </button>
      </div>

      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <span>{actionError}</span>
          <button
            aria-label="Dismiss error"
            onClick={() => setActionError("")}
            className="shrink-0 rounded p-1 hover:bg-destructive/10"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total cases" value={cases.length} />
        <SummaryCard
          label="Ready to run"
          value={cases.filter((item) => item.status === "Ready").length}
        />
        <SummaryCard
          label="High / critical"
          value={
            cases.filter(
              (item) =>
                item.priority === "High" || item.priority === "Critical"
            ).length
          }
        />
      </div>

      <div className="rounded-2xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label="Search test cases"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, ID, or description..."
              className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {["All", "Critical", "High", "Medium", "Low"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {["All", "Draft", "Ready", "Blocked"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>

        {!loaded ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Loading test cases...
          </p>
        ) : loadingError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p role="alert" className="text-sm text-destructive">
              {loadingError}
            </p>
            <button
              onClick={() => void loadCases()}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Try again
            </button>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted">
              <ClipboardList className="size-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium">
              {cases.length === 0
                ? "Your test library starts here"
                : "No matching cases"}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {cases.length === 0
                ? "Create your first test case to document a scenario, its steps, and the expected outcome."
                : "Try changing your search or filters."}
            </p>
            {cases.length === 0 && (
              <button
                onClick={openCreateForm}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                <Plus className="size-4" />
                Create first test case
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredCases.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-4 p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-start sm:justify-between sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.id}
                    </span>
                    <Pill value={item.priority} />
                    <Pill value={item.status} />
                  </div>
                  <h3 className="font-medium">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {item.expected && (
                    <p className="mt-3 text-sm">
                      <span className="font-medium">Expected:</span>{" "}
                      <span className="text-muted-foreground">
                        {item.expected}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    aria-label={`Edit ${item.title}`}
                    onClick={() => openEditForm(item)}
                    className="inline-flex size-9 items-center justify-center rounded-lg border hover:bg-muted"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    aria-label={`Delete ${item.title}`}
                    disabled={deletingId === item.id}
                    onClick={() => void deleteCase(item.id)}
                    className="inline-flex size-9 items-center justify-center rounded-lg border text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="border-t px-4 py-3 text-xs text-muted-foreground">
          Showing {filteredCases.length} of {cases.length} test cases · Saved to database
        </div>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="test-case-form-title"
            className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 id="test-case-form-title" className="text-lg font-semibold">
                  {editingId ? "Edit test case" : "Create test case"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Document the scenario and define what success looks like.
                </p>
              </div>
              <button
                aria-label="Close form"
                disabled={saving}
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={saveCase} className="space-y-4 p-5">
              <div>
                <label className={labelClass} htmlFor="case-title">
                  Title *
                </label>
                <input
                  id="case-title"
                  required
                  autoFocus
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="e.g. User can sign in with valid credentials"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="case-description">
                  Description
                </label>
                <textarea
                  id="case-description"
                  rows={2}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="What behavior are you testing?"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="case-steps">
                  Test steps
                </label>
                <textarea
                  id="case-steps"
                  rows={3}
                  value={form.steps}
                  onChange={(event) =>
                    setForm({ ...form, steps: event.target.value })
                  }
                  placeholder={"1. Open the login page\n2. Enter valid credentials\n3. Click Sign in"}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="case-expected">
                  Expected result
                </label>
                <textarea
                  id="case-expected"
                  rows={2}
                  value={form.expected}
                  onChange={(event) =>
                    setForm({ ...form, expected: event.target.value })
                  }
                  placeholder="The user is redirected to the dashboard."
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="case-priority">
                    Priority
                  </label>
                  <select
                    id="case-priority"
                    value={form.priority}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        priority: event.target.value as Priority,
                      })
                    }
                    className={inputClass}
                  >
                    {["Low", "Medium", "High", "Critical"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="case-status">
                    Status
                  </label>
                  <select
                    id="case-status"
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as Status,
                      })
                    }
                    className={inputClass}
                  >
                    {["Draft", "Ready", "Blocked"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </div>
              </div>

              {actionError && (
                <p role="alert" className="text-sm text-destructive">
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save changes"
                    : "Create test case"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Pill({ value }: { value: string }) {
  const styles: Record<string, string> = {
    Critical: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    High: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Low: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    Ready: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    Blocked: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    Draft: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`rounded-md px-2 py-1 text-[11px] font-medium ${
        styles[value] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {value}
    </span>
  );
}
