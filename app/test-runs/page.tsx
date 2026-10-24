
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FlaskConical,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";

type TestRun = {
  id: string;
  name: string;
  environment: string;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  status: string;
  startedAt: string;
  completedAt?: string | null;
};

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function statusLabel(status: string) {
  return status.toUpperCase() === "PASSED" ? "Passed" : status.toUpperCase() === "FAILED" ? "Failed" : "Running";
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const styles =
    normalized === "PASSED"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600"
      : normalized === "FAILED"
        ? "border-red-500/25 bg-red-500/10 text-red-600"
        : "border-amber-500/25 bg-amber-500/10 text-amber-600";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}>
      {statusLabel(status)}
    </span>
  );
}

export default function TestRunsPage() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState("DEVELOPMENT");
  const [passed, setPassed] = useState("3");
  const [failed, setFailed] = useState("0");
  const [skipped, setSkipped] = useState("0");

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/test-runs", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load test runs.");
      }

      const data: TestRun[] = await response.json();
      setRuns(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const filteredRuns = runs.filter((run) => {
    const matchesSearch =
      `${run.name} ${run.id} ${run.environment}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      run.status.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPassed = runs.reduce((sum, run) => sum + run.passed, 0);
  const totalFailed = runs.reduce((sum, run) => sum + run.failed, 0);

  async function createRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const passedCount = Number(passed);
    const failedCount = Number(failed);
    const skippedCount = Number(skipped);

    if (
      ![passedCount, failedCount, skippedCount].every(
        (count) => Number.isSafeInteger(count) && count >= 0
      ) ||
      passedCount + failedCount + skippedCount < 1
    ) {
      setError("Enter valid non-negative whole numbers, with at least one test.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/test-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          environment,
          passed: passedCount,
          failed: failedCount,
          skipped: skippedCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create test run.");
      }

      setName("");
      setPassed("3");
      setFailed("0");
      setSkipped("0");
      setShowForm(false);
      setSuccess("Test run created and saved successfully.");
      await loadRuns();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create test run."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-7 px-5 py-8 sm:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FlaskConical className="size-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Test Runs
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Execution history, results, and environment health.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void loadRuns()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setError("");
                setSuccess("");
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="size-4" />
              New test run
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600">
            {success}
          </div>
        )}

        {showForm && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Create a test run</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Record execution results for an environment.
              </p>
            </div>

            <form onSubmit={createRun} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium sm:col-span-2">
                  Run name
                  <input
                    required
                    maxLength={120}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Login regression suite"
                    className={inputClass}
                  />
                </label>

                <label className="space-y-2 text-sm font-medium">
                  Environment
                  <select
                    value={environment}
                    onChange={(event) => setEnvironment(event.target.value)}
                    className={inputClass}
                  >
                    <option value="DEVELOPMENT">Development</option>
                    <option value="STAGING">Staging</option>
                    <option value="PRODUCTION">Production</option>
                  </select>
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <label className="space-y-2 text-sm font-medium">
                    Passed
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={passed}
                      onChange={(event) => setPassed(event.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    Failed
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={failed}
                      onChange={(event) => setFailed(event.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    Skipped
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={skipped}
                      onChange={(event) => setSkipped(event.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save test run"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total executions</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{runs.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Recorded test runs</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Tests passed
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{totalPassed}</p>
            <p className="mt-1 text-xs text-muted-foreground">Across recorded runs</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="size-4 text-red-500" />
              Tests failed
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{totalFailed}</p>
            <p className="mt-1 text-xs text-muted-foreground">Across recorded runs</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Execution history</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredRuns.length} {filteredRuns.length === 1 ? "run" : "runs"} shown
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search test runs..."
                  aria-label="Search test runs"
                  className={`${inputClass} pl-9 sm:w-64`}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by status"
                className={inputClass}
              >
                <option value="ALL">All statuses</option>
                <option value="PASSED">Passed</option>
                <option value="FAILED">Failed</option>
                <option value="RUNNING">Running</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Loading execution history...
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                <FlaskConical className="size-5 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">
                {runs.length === 0 ? "No test runs yet" : "No matching test runs"}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {runs.length === 0
                  ? "Create your first test run to start tracking execution results."
                  : "Try a different search term or status filter."}
              </p>
              {runs.length === 0 && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  <Plus className="mr-2 inline size-4" />
                  Create test run
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3.5 font-medium">Test suite</th>
                      <th className="px-5 py-3.5 font-medium">Results</th>
                      <th className="px-5 py-3.5 font-medium">Status</th>
                      <th className="px-5 py-3.5 font-medium">Environment</th>
                      <th className="px-5 py-3.5 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRuns.map((run) => (
                      <tr key={run.id} className="transition hover:bg-muted/30">
                        <td className="px-5 py-4">
                          <p className="font-medium">{run.name}</p>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {run.id.slice(0, 8)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium tabular-nums">
                            {run.passed}/{run.total} passed
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {run.failed} failed · {run.skipped} skipped
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={run.status} />
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {run.environment.charAt(0) +
                            run.environment.slice(1).toLowerCase()}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          <span className="inline-flex items-center gap-2">
                            <Clock3 className="size-3.5" />
                            {formatDate(run.startedAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-border md:hidden">
                {filteredRuns.map((run) => (
                  <article key={run.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words font-medium">{run.name}</h3>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {run.id.slice(0, 8)} · {run.environment}
                        </p>
                      </div>
                      <StatusBadge status={run.status} />
                    </div>
                    <p className="text-sm">
                      <span className="font-semibold">{run.passed}/{run.total}</span> passed
                      <span className="text-muted-foreground"> · {run.failed} failed · {run.skipped} skipped</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(run.startedAt)}
                    </p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <p className="text-center text-xs text-muted-foreground">
          Showing the latest 100 runs stored in TestPilot.
        </p>
      </div>
    </main>
  );
}
