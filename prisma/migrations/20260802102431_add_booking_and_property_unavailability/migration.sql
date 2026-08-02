-- Required for the GiST exclusion constraint on "property_unavailability" below
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- CreateTable
CREATE TABLE "bookings" (
    "id" BIGSERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "guestId" BIGINT NOT NULL,
    "propertyId" BIGINT NOT NULL,
    "checkInDate" DATE NOT NULL,
    "checkOutDate" DATE NOT NULL,
    "nightlyRate" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_unavailability" (
    "id" BIGSERIAL NOT NULL,
    "propertyId" BIGINT NOT NULL,
    "bookingId" BIGINT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_unavailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_slug_key" ON "bookings"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "property_unavailability_bookingId_key" ON "property_unavailability"("bookingId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_unavailability" ADD CONSTRAINT "property_unavailability_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_unavailability" ADD CONSTRAINT "property_unavailability_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Prevent overlapping unavailable date ranges for the same property, at the database level.
-- Checkout is exclusive: daterange(..., '[)') means a range ending on day X does not conflict
-- with a range starting on day X. This must stay consistent with any application-level overlap
-- query (see the property-availability module).
ALTER TABLE "property_unavailability" ADD CONSTRAINT "property_unavailability_no_overlap"
    EXCLUDE USING gist (
        "propertyId" WITH =,
        daterange("startDate", "endDate", '[)') WITH &&
    );
