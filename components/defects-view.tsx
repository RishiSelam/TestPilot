
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  Clock3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

type Defect = {
  id: string;
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  severity: string;
  status: string;
  environment: string;
  testCase?: { title?: string } | null;
  testRun?: { id?: string } | null;
  createdAt: string;
};

type DefectForm = {
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  severity: string;
  status: string;
  environment: string;
};

const emptyForm: DefectForm = {
  title: "",
  description: "",
  stepsToReproduce: "",
  expectedResult: "",
  actualResult: "",
  severity: "MEDIUM",
  status: "OPEN",
  environment: "DEVELOPMENT",
};

const severityStyles: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-red-500",
  HIGH: "bg-orange-500/10 text-orange-500",
  MEDIUM: "bg-yellow-500/10 text-yellow-600",
  LOW: "bg-blue-500/10 text-blue-500",
};

const statusStyles: Record<string, string> = {
  OPEN: "bg-red-500/10 text-red-500",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500",
  RESOLVED: "bg-green-500/10 text-green-600",
  CLOSED: "bg-muted text-muted-foreground",
};

function readable(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DefectsView() {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DefectForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchDefects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/defects");
      if (!response.ok) throw new Error("Could not load defects.");

      const data = await response.json();
      setDefects(Array.isArray(data) ? data : data.defects ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDefects();
  }, [fetchDefects]);

  const filteredDefects = useMemo(() => {
    return defects.filter((defect) => {
      const matchesSearch =
        defect.title.toLowerCase().includes(search.toLowerCase()) ||
        defect.description?.toLowerCase().includes(search.toLowerCase()) ||
        defect.id.toLowerCase().includes(search.toLowerCase());

      const matchesSeverity =
        severityFilter === "ALL" || defect.severity === severityFilter;

      const matchesStatus =
        statusFilter === "ALL" || defect.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [defects, search, severityFilter, statusFilter]);

  const counts = {
    total: defects.length,
    open: defects.filter((d) => d.status === "OPEN").length,
    progress: defects.filter((d) => d.status === "IN_PROGRESS").length,
    resolved: defects.filter(
      (d) => d.status === "RESOLVED" || d.status === "CLOSED"
    ).length,
  };

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(defect: Defect) {
    setEditingId(defect.id);
    setForm({
      title: defect.title,
      description: defect.description ?? "",
      stepsToReproduce: defect.stepsToReproduce ?? "",
      expectedResult: defect.expectedResult ?? "",
      actualResult: defect.actualResult ?? "",
      severity: defect.severity,
      status: defect.status,
      environment: defect.environment,
    });
    setShowForm(true);
  }

  async function saveDefect(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        editingId ? `/api/defects/${editingId}` : "/api/defects",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Could not save the defect.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await fetchDefects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDefect(id: string) {
    if (!window.confirm("Are you sure you want to delete this defect?")) return;

    try {
      const response = await fetch(`/api/defects/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Could not delete the defect.");
      await fetchDefects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function updateField<K extends keyof DefectForm>(
    field: K,
    value: DefectForm[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="min-h-screen bg-background p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Bug size={16} />
              TestPilot / Defects
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Defect Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track, investigate, and manage software defects.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchDefects}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={startCreate}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus size={17} />
              Report Defect
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-500">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        {/* Overview cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Defects"
            value={counts.total}
            icon={<Bug size={19} />}
            description="All recorded defects"
          />
          <StatCard
            label="Open"
            value={counts.open}
            icon={<AlertCircle size={19} />}
            description="Awaiting investigation"
          />
          <StatCard
            label="In Progress"
            value={counts.progress}
            icon={<Clock3 size={19} />}
            description="Currently being worked on"
          />
          <StatCard
            label="Resolved"
            value={counts.resolved}
            icon={<CheckCircle2 size={19} />}
            description="Resolved or closed"
          />
        </section>

        {/* Defect table */}
        <section className="rounded-xl border bg-card">
          <div className="flex flex-col justify-between gap-4 border-b p-5 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold">Reported Defects</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredDefects.length} of {defects.length} defects
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search defects..."
                  className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 sm:w-56"
                />
              </div>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Loading defects...
            </div>
          ) : filteredDefects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <Bug size={32} className="text-muted-foreground" />
              <div>
                <p className="font-medium">No defects found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try changing your filters or report a new defect.
                </p>
              </div>
              <button
                onClick={startCreate}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                Report your first defect
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4 font-medium">Defect</th>
                    <th className="px-5 py-4 font-medium">Severity</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Environment</th>
                    <th className="px-5 py-4 font-medium">Reported</th>
                    <th className="px-5 py-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredDefects.map((defect) => (
                    <tr key={defect.id} className="hover:bg-muted/20">
                      <td className="min-w-64 px-5 py-4">
                        <p className="font-medium">{defect.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          DEF-{defect.id.slice(-6).toUpperCase()}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${severityStyles[defect.severity] ?? ""}`}
                        >
                          {readable(defect.severity)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[defect.status] ?? ""}`}
                        >
                          {readable(defect.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {readable(defect.environment)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                        {new Date(defect.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(defect)}
                            className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteDefect(defect.id)}
                            aria-label="Delete defect"
                            className="rounded-md border p-1.5 text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Create / Edit form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-card shadow-xl">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h2 className="text-lg font-semibold">
                    {editingId ? "Edit Defect" : "Report a Defect"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Provide details to help investigate the issue.
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg p-2 hover:bg-muted"
                  aria-label="Close form"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={saveDefect} className="space-y-4 p-5">
                <FormField label="Title" required>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="e.g. Login button does not respond"
                    className="form-input"
                  />
                </FormField>

                <FormField label="Description">
                  <textarea
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={2}
                    placeholder="Describe the issue..."
                    className="form-input"
                  />
                </FormField>

                <FormField label="Steps to Reproduce">
                  <textarea
                    value={form.stepsToReproduce}
                    onChange={(e) => updateField("stepsToReproduce", e.target.value)}
                    rows={3}
                    placeholder="1. Open the login page&#10;2. Enter credentials&#10;3. Click Login"
                    className="form-input"
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Expected Result">
                    <textarea
                      value={form.expectedResult}
                      onChange={(e) => updateField("expectedResult", e.target.value)}
                      rows={3}
                      className="form-input"
                    />
                  </FormField>
                  <FormField label="Actual Result">
                    <textarea
                      value={form.actualResult}
                      onChange={(e) => updateField("actualResult", e.target.value)}
                      rows={3}
                      className="form-input"
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label="Severity">
                    <select
                      value={form.severity}
                      onChange={(e) => updateField("severity", e.target.value)}
                      className="form-input"
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </FormField>

                  <FormField label="Status">
                    <select
                      value={form.status}
                      onChange={(e) => updateField("status", e.target.value)}
                      className="form-input"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </FormField>

                  <FormField label="Environment">
                    <select
                      value={form.environment}
                      onChange={(e) => updateField("environment", e.target.value)}
                      className="form-input"
                    >
                      <option value="DEVELOPMENT">Development</option>
                      <option value="STAGING">Staging</option>
                      <option value="PRODUCTION">Production</option>
                    </select>
                  </FormField>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Defect"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .form-input {
          width: 100%;
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          background: hsl(var(--background));
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .form-input:focus {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
        }
      `}</style>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  description,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
