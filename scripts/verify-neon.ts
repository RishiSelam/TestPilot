import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const counts = {
    TestCase: await prisma.testCase.count(),
    TestRun: await prisma.testRun.count(),
    Defect: await prisma.defect.count(),
    ApiRequest: await prisma.apiRequest.count(),
  };

  console.table(counts);

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  console.log("Total records:", total);

  const defects = await prisma.defect.findMany({
    select: {
      id: true,
      testCaseId: true,
      testRunId: true,
      testCase: { select: { id: true } },
      testRun: { select: { id: true } },
    },
  });

  console.log(
    "Defect relationships:",
    defects.map((defect) => ({
      testCaseLinked: Boolean(defect.testCase),
      testRunLinked: Boolean(defect.testRun),
    }))
  );

  if (
    total !== 52 ||
    counts.TestCase !== 2 ||
    counts.TestRun !== 4 ||
    counts.Defect !== 1 ||
    counts.ApiRequest !== 45
  ) {
    throw new Error("Record count verification failed.");
  }

  console.log("Neon verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });