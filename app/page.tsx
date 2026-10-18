"use client";

import { useState } from "react";
import TestCasesView from "@/components/test-cases-view";
import { useTheme } from "next-themes";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bug,
  Check,
  ChevronDown,
  CircleHelp,
  Command,
  FlaskConical,
  LayoutDashboard,
  ListChecks,
  Moon,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sun,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Test Cases", icon: ListChecks },
  { label: "Test Runs", icon: FlaskConical },
  { label: "API Testing", icon: Activity },
  { label: "Defects", icon: Bug },
];

const testRuns = [
  {
    name: "Authentication regression",
    id: "RUN-0248",
    environment: "Staging",
    passed: 42,
    failed: 2,
    total: 44,
    status: "Failed",
    time: "8 min ago",
  },
  {
    name: "Checkout & payments",
    id: "RUN-0247",
    environment: "Production",
    passed: 36,
    failed: 0,
    total: 36,
    status: "Passed",
    time: "24 min ago",
  },
  {
    name: "User profile API",
    id: "RUN-0246",
    environment: "Staging",
    passed: 28,
    failed: 1,
    total: 29,
    status: "Failed",
    time: "1 hr ago",
  },
  {
    name: "Dashboard smoke tests",
    id: "RUN-0245",
    environment: "Development",
    passed: 51,
    failed: 0,
    total: 51,
    status: "Passed",
    time: "2 hrs ago",
  },
];

const issues = [
  {
    id: "BUG-0192",
    title: "Login fails with expired session",
    severity: "High",
    area: "Authentication",
  },
  {
    id: "BUG-0191",
    title: "Payment confirmation delayed",
    severity: "Medium",
    area: "Checkout",
  },
  {
    id: "BUG-0189",
    title: "Incorrect error message on reset",
    severity: "Low",
    area: "User profile",
  },
];

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [activePage, setActivePage] = useState("Overview");
  const [query, setQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRunMessage, setShowRunMessage] = useState(false);

  const filteredRuns = testRuns.filter((run) =>
    `${run.name} ${run.id} ${run.environment}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const pageDescriptions: Record<string, string> = {
    Overview: "Here's what's happening across your testing workspace.",
    "Test Cases": "Organize and review your test coverage.",
    "Test Runs": "Review execution history and test results.",
    "API Testing": "Monitor API checks and endpoint reliability.",
    Defects: "Track issues discovered during testing.",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 border-r bg-card/50 px-4 py-5 md:flex md:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-tight">
                TestPilot
              </p>
              <p className="text-xs text-muted-foreground">
                Quality workspace
              </p>
            </div>
          </div>

          <div className="mt-9 px-2">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Workspace
            </p>
            <button className="flex w-full items-center justify-between rounded-xl border bg-background px-3 py-3 text-left shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Command className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Acme Platform</p>
                  <p className="text-xs text-muted-foreground">
                    Free workspace
                  </p>
                </div>
              </div>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
          </div>

          <nav className="mt-8 flex-1">
            <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Quality assurance
            </p>
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.label;

                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActivePage(item.label);
                      setQuery("");
                      setShowRunMessage(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-[17px]" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.label === "Defects" && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                          active
                            ? "bg-white/15 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        3
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <Separator className="my-6" />

            <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Preferences
            </p>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Settings2 className="size-[17px]" />
              Notifications
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {theme === "dark" ? (
                <Sun className="size-[17px]" />
              ) : (
                <Moon className="size-[17px]" />
              )}
              {theme === "dark" ? "Light appearance" : "Dark appearance"}
            </button>
          </nav>

          <div className="rounded-2xl border bg-background p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <Zap className="size-4 text-amber-500" />
              <span className="text-sm font-medium">Testing tip</span>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Run regression tests after every significant code change to catch
              unexpected failures early.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-sm font-semibold text-white">
              R
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">QA Engineer</p>
              <p className="truncate text-xs text-muted-foreground">
                Local workspace
              </p>
            </div>
            <MoreHorizontal className="size-4 text-muted-foreground" />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between gap-3 border-b bg-background/85 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-muted-foreground sm:inline">
                Workspace
              </span>
              <span className="hidden text-muted-foreground sm:inline">/</span>
              <span className="truncate font-medium">{activePage}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search test runs..."
                  className="h-9 w-48 rounded-xl border bg-muted/40 pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 lg:w-60"
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                className="relative size-9 rounded-xl"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-blue-500" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-xl"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle appearance"
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>

              <Button
                size="sm"
                className="h-9 gap-2 rounded-xl px-3"
                onClick={() => setShowRunMessage(true)}
              >
                <Play className="size-3.5" />
                <span className="hidden sm:inline">New test run</span>
                <span className="sm:hidden">Run</span>
              </Button>
            </div>
          </header>

          {showNotifications && (
            <div className="absolute right-5 top-[76px] z-20 w-72 rounded-2xl border bg-card p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Notifications</p>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                One failed test run and three demo defects need review.
              </p>
            </div>
          )}

          <div className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-10">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <p className="text-xs font-medium text-muted-foreground">
                    YOUR QA COMMAND CENTER
                  </p>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-[34px]">
                  {activePage === "Overview" ? "Good evening." : activePage}
                </h1>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-[15px]">
                  {pageDescriptions[activePage]}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="h-8 rounded-lg px-3 font-normal"
                >
                  <span className="mr-2 size-1.5 rounded-full bg-amber-500" />
                  Demo data
                </Badge>

                {activePage !== "Test Cases" && (
                  <Button
                    variant="outline"
                    className="h-9 gap-2 rounded-xl"
                    onClick={() => {
                      setActivePage("Test Cases");
                      setShowRunMessage(false);
                    }}
                  >
                    <Plus className="size-4" />
                    Add test case
                  </Button>
                )}
              </div>
            </div>

            {showRunMessage && activePage !== "Test Cases" && (
              <div className="mb-6 flex flex-col justify-between gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold">Test run setup</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The runner isn't connected yet. Next we'll implement actual
                    test execution.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRunMessage(false)}
                >
                  Got it
                </Button>
              </div>
            )}

            {activePage === "Test Cases" ? (
              <TestCasesView />
            ) : (
              <>
                <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    title="Total test cases"
                    value="248"
                    change="+12 this week"
                    positive
                    icon={ListChecks}
                    description="Across all test suites"
                  />
                  <MetricCard
                    title="Pass rate"
                    value="94.8%"
                    change="+2.4% vs last week"
                    positive
                    icon={ShieldCheck}
                    description="Based on demo executions"
                  />
                  <MetricCard
                    title="Tests executed"
                    value="1,284"
                    change="+18.6% this month"
                    positive
                    icon={Activity}
                    description="Across recent test runs"
                  />
                  <MetricCard
                    title="Open defects"
                    value="12"
                    change="3 high priority"
                    positive={false}
                    icon={Bug}
                    description="Awaiting investigation"
                  />
                </div>

                <div className="mb-8 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
                  <Card className="overflow-hidden rounded-2xl shadow-none">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-base font-semibold">
                          Execution overview
                        </CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Test outcomes across the last 7 days
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 rounded-lg text-muted-foreground"
                      >
                        This week <ChevronDown className="size-3.5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <p className="text-3xl font-semibold tracking-tight">
                            1,284
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Total executions
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs">
                          <Legend color="bg-emerald-500" label="Passed 1,217" />
                          <Legend color="bg-rose-500" label="Failed 51" />
                          <Legend color="bg-amber-500" label="Skipped 16" />
                        </div>
                      </div>

                      <div className="flex h-[180px] items-end justify-between gap-2 sm:gap-4">
                        {[
                          { day: "Mon", pass: 65, fail: 12, skip: 5 },
                          { day: "Tue", pass: 80, fail: 8, skip: 4 },
                          { day: "Wed", pass: 72, fail: 15, skip: 4 },
                          { day: "Thu", pass: 90, fail: 6, skip: 2 },
                          { day: "Fri", pass: 78, fail: 10, skip: 5 },
                          { day: "Sat", pass: 57, fail: 5, skip: 2 },
                          { day: "Sun", pass: 86, fail: 7, skip: 3 },
                        ].map((day) => (
                          <div
                            key={day.day}
                            className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                          >
                            <div className="flex h-full w-full max-w-12 items-end overflow-hidden rounded-t-lg bg-muted/50">
                              <div className="flex w-full flex-col">
                                <div
                                  className="w-full bg-amber-500/90"
                                  style={{ height: `${day.skip * 0.8}px` }}
                                />
                                <div
                                  className="w-full bg-rose-500/90"
                                  style={{ height: `${day.fail * 0.8}px` }}
                                />
                                <div
                                  className="w-full rounded-t-sm bg-emerald-500/90"
                                  style={{ height: `${day.pass * 1.1}px` }}
                                />
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {day.day}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">
                        Quality score
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Overall test stability
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6 py-3">
                        <div className="relative flex size-32 shrink-0 items-center justify-center rounded-full">
                          <svg
                            viewBox="0 0 120 120"
                            className="absolute inset-0 size-full -rotate-90"
                          >
                            <circle
                              cx="60"
                              cy="60"
                              r="47"
                              stroke="currentColor"
                              strokeOpacity="0.09"
                              strokeWidth="10"
                              fill="none"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="47"
                              stroke="#10b981"
                              strokeWidth="10"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 47 * 0.948} ${2 * Math.PI * 47}`}
                              fill="none"
                            />
                          </svg>
                          <div className="text-center">
                            <p className="text-2xl font-semibold tracking-tight">
                              94.8
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              OUT OF 100
                            </p>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-4">
                          <div>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                Stability
                              </span>
                              <span className="font-medium">96%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div className="h-full w-[96%] rounded-full bg-emerald-500" />
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                Coverage
                              </span>
                              <span className="font-medium">88%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div className="h-full w-[88%] rounded-full bg-blue-500" />
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                Reliability
                              </span>
                              <span className="font-medium">93%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div className="h-full w-[93%] rounded-full bg-violet-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="size-3.5 text-emerald-500" />
                        All metrics shown are illustrative demo values.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
                  <Card className="rounded-2xl shadow-none">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-base font-semibold">
                          Recent test runs
                        </CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          The latest activity from your test suites
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 rounded-lg text-muted-foreground"
                        onClick={() => setActivePage("Test Runs")}
                      >
                        View all <ArrowRight className="size-3.5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="px-0 pb-1">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[570px] text-left text-sm">
                          <thead>
                            <tr className="border-y bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                              <th className="px-6 py-3 font-medium">Test suite</th>
                              <th className="px-4 py-3 font-medium">Results</th>
                              <th className="px-4 py-3 font-medium">Status</th>
                              <th className="px-6 py-3 text-right font-medium">
                                Time
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRuns.map((run) => (
                              <tr
                                key={run.id}
                                className="border-b last:border-0 transition-colors hover:bg-muted/20"
                              >
                                <td className="px-6 py-4">
                                  <p className="font-medium">{run.name}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {run.id} · {run.environment}
                                  </p>
                                </td>
                                <td className="px-4 py-4">
                                  <p className="font-medium">
                                    {run.passed}/{run.total}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {run.failed} failed
                                  </p>
                                </td>
                                <td className="px-4 py-4">
                                  <Badge
                                    variant="outline"
                                    className={`rounded-lg font-medium ${
                                      run.status === "Passed"
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                    }`}
                                  >
                                    {run.status}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                                  {run.time}
                                </td>
                              </tr>
                            ))}
                            {filteredRuns.length === 0 && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                                >
                                  No test runs match your search.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl shadow-none">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-base font-semibold">
                          Open defects
                        </CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Issues requiring attention
                        </p>
                      </div>
                      <Badge variant="secondary" className="rounded-lg">
                        3 shown
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {issues.map((issue) => (
                        <button
                          key={issue.id}
                          onClick={() => setActivePage("Defects")}
                          className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/60"
                        >
                          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                            <Bug className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-5">
                              {issue.title}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {issue.id} · {issue.area}
                            </p>
                            <div className="mt-2">
                              <Badge
                                variant="outline"
                                className={`rounded-md text-[10px] ${
                                  issue.severity === "High"
                                    ? "border-rose-500/30 text-rose-500"
                                    : issue.severity === "Medium"
                                      ? "border-amber-500/30 text-amber-600"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {issue.severity} priority
                              </Badge>
                            </div>
                          </div>
                        </button>
                      ))}
                      <Button
                        variant="outline"
                        className="mt-3 w-full rounded-xl"
                        onClick={() => setActivePage("Defects")}
                      >
                        View defect tracker <ArrowRight className="ml-2 size-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            <footer className="mt-8 flex flex-col justify-between gap-2 border-t pt-5 text-xs text-muted-foreground sm:flex-row">
              <p>TestPilot · Quality engineering workspace</p>
              <p className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Frontend running locally
                <span className="mx-1">·</span>
                <CircleHelp className="size-3.5" />
                Demo environment
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  positive,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  description: string;
}) {
  return (
    <Card className="rounded-2xl shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
            <Icon className="size-[17px] text-muted-foreground" />
          </div>
        </div>
        <p className="text-[30px] font-semibold tracking-tight">{value}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {positive ? (
            <ArrowUpRight className="size-3.5 text-emerald-500" />
          ) : (
            <ArrowDownRight className="size-3.5 text-rose-500" />
          )}
          <span
            className={`text-xs font-medium ${
              positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-500"
            }`}
          >
            {change}
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`size-2 rounded-sm ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
