import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { Prisma } from '../../generated/prisma/client.js';
import { BookingModel } from '../../generated/prisma/models/Booking.js';
import { PropertyUnavailabilityModel } from '../../generated/prisma/models/PropertyUnavailability.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BookingUnavailableError } from './booking-unavailable.error.js';

const EXCLUSION_VIOLATION_CODE = '23P01';

const generateBookingSlug = customAlphabet(
  '23456789ABCDEFGHJKMNPQRSTUVWXYZ',
  8,
);

function isExclusionViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;

  const meta = error.meta as
    { driverAdapterError?: { cause?: { originalCode?: string } } } | undefined;
  return (
    meta?.driverAdapterError?.cause?.originalCode === EXCLUSION_VIOLATION_CODE
  );
}

@Injectable()
export class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOverlappingUnavailability({
    propertyId,
    startDate,
    endDate,
  }: {
    propertyId: bigint;
    startDate: Date;
    endDate: Date;
  }): Promise<PropertyUnavailabilityModel | null> {
    return this.prisma.propertyUnavailability.findFirst({
      where: {
        propertyId,
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    });
  }

  async create({
    guestId,
    propertyId,
    checkInDate,
    checkOutDate,
    nightlyRate,
    totalAmount,
    paymentStatus,
  }: {
    guestId: bigint;
    propertyId: bigint;
    checkInDate: Date;
    checkOutDate: Date;
    nightlyRate: Prisma.Decimal | number | string;
    totalAmount: Prisma.Decimal | number | string;
    paymentStatus: string;
  }): Promise<BookingModel> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            slug: generateBookingSlug(),
            guestId,
            propertyId,
            checkInDate,
            checkOutDate,
            nightlyRate,
            totalAmount,
            paymentStatus,
          },
        });

        await tx.propertyUnavailability.create({
          data: {
            propertyId,
            bookingId: booking.id,
            startDate: checkInDate,
            endDate: checkOutDate,
            source: 'booking',
          },
        });

        return booking;
      });
    } catch (error) {
      if (isExclusionViolation(error)) {
        throw new BookingUnavailableError();
      }
      throw error;
    }
  }
}
