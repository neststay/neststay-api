import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PropertyService } from '../property/property.service.js';
import { AvailabilityResponseDto } from './dto/availability-response.dto.js';
import { BookingResponseDto } from './dto/booking-response.dto.js';
import { BookingRepository } from './booking.repository.js';
import { BookingUnavailableError } from './booking-unavailable.error.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PAYMENT_STATUS_DONE = 'done';

@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly propertyService: PropertyService,
  ) {}

  async createBooking({
    guestId,
    propertySlug,
    checkInDate,
    checkOutDate,
  }: {
    guestId: bigint;
    propertySlug: string;
    checkInDate: Date;
    checkOutDate: Date;
  }): Promise<BookingResponseDto> {
    const property = await this.propertyService.getEntityBySlug(propertySlug);
    if (!property) {
      throw new NotFoundException(`Property ${propertySlug} not found`);
    }

    const nights = Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) / MS_PER_DAY,
    );
    const nightlyRate = property.nightlyRate;
    const totalAmount = nightlyRate.mul(nights);

    try {
      const booking = await this.bookingRepository.create({
        guestId,
        propertyId: property.id,
        checkInDate,
        checkOutDate,
        nightlyRate,
        totalAmount,
        paymentStatus: PAYMENT_STATUS_DONE,
      });

      const dto = new BookingResponseDto();
      dto.slug = booking.slug;
      dto.propertySlug = property.slug;
      dto.checkInDate = booking.checkInDate;
      dto.checkOutDate = booking.checkOutDate;
      dto.nightlyRate = booking.nightlyRate.toString();
      dto.totalAmount = booking.totalAmount.toString();
      dto.paymentStatus = booking.paymentStatus;
      dto.createdAt = booking.createdAt;
      return dto;
    } catch (error) {
      if (error instanceof BookingUnavailableError) {
        throw new ConflictException('Requested dates are unavailable');
      }
      throw error;
    }
  }

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
