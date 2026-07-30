-- CreateTable
CREATE TABLE "search_history" (
    "id" BIGSERIAL NOT NULL,
    "searchId" TEXT NOT NULL,
    "userId" BIGINT,
    "query" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "search_history_searchId_key" ON "search_history"("searchId");
