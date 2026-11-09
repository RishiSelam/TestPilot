-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "steps" TEXT NOT NULL,
    "expected" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestRun" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'Development',
    "passed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Defect" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "stepsToReproduce" TEXT NOT NULL DEFAULT '',
    "expectedResult" TEXT NOT NULL DEFAULT '',
    "actualResult" TEXT NOT NULL DEFAULT '',
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "environment" TEXT NOT NULL DEFAULT 'DEVELOPMENT',
    "testCaseId" TEXT,
    "testRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Defect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "url" TEXT NOT NULL,
    "headers" TEXT NOT NULL DEFAULT '{}',
    "body" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
