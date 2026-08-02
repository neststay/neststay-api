import { Injectable } from '@nestjs/common';
import { PropertyService } from '../property/property.service.js';
import { AvailabilityResponseDto } from './dto/availability-response.dto.js';
import { BookingRepository } from './booking.repository.js';

@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly propertyService: PropertyService,
  ) {}

  async checkAvailability({
    slug,
    startDate,
    endDate,
  }: {
    slug: string;
    startDate: Date;
    endDate: Date;
  }): Promise<AvailabilityResponseDto> {
    const propertyId = await this.propertyService.getIdBySlug(slug);
    const overlapping =
      await this.bookingRepository.findOverlappingUnavailability({
        propertyId,
        startDate,
        endDate,
      });

    const dto = new AvailabilityResponseDto();
    dto.isAvailable = !overlapping;
    return dto;
  }
}
