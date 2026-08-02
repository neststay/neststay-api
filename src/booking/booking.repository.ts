import { Injectable } from '@nestjs/common';
import { PropertyUnavailabilityModel } from '../../generated/prisma/models/PropertyUnavailability.js';
import { PrismaService } from '../prisma/prisma.service.js';

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
}
