-- CreateTable
CREATE TABLE "favourite_property" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favourite_property_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favourite_property_userId_propertyId_key" ON "favourite_property"("userId", "propertyId");

-- AddForeignKey
ALTER TABLE "favourite_property" ADD CONSTRAINT "favourite_property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favourite_property" ADD CONSTRAINT "favourite_property_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
