import "dotenv/config";
import Database from "better-sqlite3";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../lib/generated/prisma/client";

const apply = process.argv.includes("--apply");

const sqlite = new Database("dev.db", { readonly: true });

type SqliteRow = {
  id: string;
  testCaseId?: string | null;
  testRunId?: string | null;
  [key: string]: any;
};

const read = (table: string): SqliteRow[] =>
  sqlite.prepare(`SELECT * FROM "${table}"`).all() as SqliteRow[];

const toDate = (value: unknown) => {
  if (value === null || value === undefined) return null;

  const date = new Date(value as string | number);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date encountered: ${String(value)}`);
  }

  return date;
};

async function main() {
  const testCases = read("TestCase").map((row) => ({
    ...row,
    createdAt: toDate(row.createdAt)!,
    updatedAt: toDate(row.updatedAt)!,
  }));

  const testRuns = read("TestRun").map((row) => ({
    ...row,
    startedAt: toDate(row.startedAt)!,
    completedAt: toDate(row.completedAt),
    createdAt: toDate(row.createdAt)!,
    updatedAt: toDate(row.updatedAt)!,
  }));

  const defects = read("Defect").map((row) => ({
    ...row,
    createdAt: toDate(row.createdAt)!,
    updatedAt: toDate(row.updatedAt)!,
  }));

  const apiRequests = read("ApiRequest").map((row) => ({
    ...row,
    createdAt: toDate(row.createdAt)!,
    updatedAt: toDate(row.updatedAt)!,
  }));

  const allIds = [
    ...testCases.map((row) => row.id),
    ...testRuns.map((row) => row.id),
    ...defects.map((row) => row.id),
    ...apiRequests.map((row) => row.id),
  ];

  if (allIds.some((id) => !id) || new Set(allIds).size !== allIds.length) {
    throw new Error("Missing or duplicate record IDs found.");
  }

  const testCaseIds = new Set(testCases.map((row) => row.id));
  const testRunIds = new Set(testRuns.map((row) => row.id));

  for (const defect of defects) {
    if (defect.testCaseId && !testCaseIds.has(defect.testCaseId)) {
      throw new Error(`Defect ${defect.id} references a missing test case.`);
    }

    if (defect.testRunId && !testRunIds.has(defect.testRunId)) {
      throw new Error(`Defect ${defect.id} references a missing test run.`);
    }
  }

  const counts = {
    TestCase: testCases.length,
    TestRun: testRuns.length,
    Defect: defects.length,
    ApiRequest: apiRequests.length,
  };

  console.log("SQLite source validation passed.");
  console.table(counts);
  console.log("Total records:", allIds.length);

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing.");
  }

  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const existing = {
      TestCase: await prisma.testCase.count(),
      TestRun: await prisma.testRun.count(),
      Defect: await prisma.defect.count(),
      ApiRequest: await prisma.apiRequest.count(),
    };

    console.log("\nCurrent Neon record counts:");
    console.table(existing);

    if (Object.values(existing).some((count) => count !== 0)) {
      throw new Error(
        "Neon is not empty. Import stopped to prevent duplicate records."
      );
    }

    if (!apply) {
      console.log("\nDRY RUN PASSED. No records were written.");
      console.log("Run with --apply only after reviewing this output.");
      return;
    }

    await prisma.$transaction([
      prisma.testCase.createMany({ data: testCases as any }),
      prisma.testRun.createMany({ data: testRuns as any }),
      prisma.apiRequest.createMany({ data: apiRequests as any }),
      prisma.defect.createMany({ data: defects as any }),
    ]);

    console.log("\nTransfer completed successfully.");
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error("\nMigration stopped:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    sqlite.close();
  });