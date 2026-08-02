import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PropertyService } from '../property/property.service.js';
import { BookingUnavailableError } from './booking-unavailable.error.js';
import { BookingRepository } from './booking.repository.js';
import { BookingService } from './booking.service.js';

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepository: {
    findOverlappingUnavailability: jest.Mock;
    create: jest.Mock;
  };
  let propertyService: {
    getIdBySlug: jest.Mock;
    getEntityBySlug: jest.Mock;
  };

  beforeEach(() => {
    bookingRepository = {
      findOverlappingUnavailability: jest.fn(),
      create: jest.fn(),
    };
    propertyService = {
      getIdBySlug: jest.fn(),
      getEntityBySlug: jest.fn(),
    };
    service = new BookingService(
      bookingRepository as unknown as BookingRepository,
      propertyService as unknown as PropertyService,
    );
  });

  describe('checkAvailability', () => {
    it('resolves the property by slug and returns available when no overlap exists', async () => {
      propertyService.getIdBySlug.mockResolvedValue(5n);
      bookingRepository.findOverlappingUnavailability.mockResolvedValue(null);
      const startDate = new Date('2026-09-01');
      const endDate = new Date('2026-09-05');

      const dto = await service.checkAvailability({
        slug: 'a-property',
        startDate,
        endDate,
      });

      expect(propertyService.getIdBySlug).toHaveBeenCalledWith('a-property');
      expect(
        bookingRepository.findOverlappingUnavailability,
      ).toHaveBeenCalledWith({ propertyId: 5n, startDate, endDate });
      expect(dto.isAvailable).toBe(true);
    });

    it('returns unavailable when an overlapping row exists', async () => {
      propertyService.getIdBySlug.mockResolvedValue(5n);
      bookingRepository.findOverlappingUnavailability.mockResolvedValue({
        id: 1n,
        propertyId: 5n,
        bookingId: 1n,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-05'),
        source: 'booking',
        createdAt: new Date(),
      });

      const dto = await service.checkAvailability({
        slug: 'a-property',
        startDate: new Date('2026-09-03'),
        endDate: new Date('2026-09-06'),
      });

      expect(dto.isAvailable).toBe(false);
    });

    it('returns available for a back-to-back range starting the day an existing range ends', async () => {
      propertyService.getIdBySlug.mockResolvedValue(5n);
      // Repository applies exclusive-checkout semantics, so a back-to-back
      // request never overlaps and the repository returns null.
      bookingRepository.findOverlappingUnavailability.mockResolvedValue(null);

      const dto = await service.checkAvailability({
        slug: 'a-property',
        startDate: new Date('2026-09-05'),
        endDate: new Date('2026-09-10'),
      });

      expect(dto.isAvailable).toBe(true);
    });
  });

  describe('createBooking', () => {
    const property = {
      id: 5n,
      slug: 'a-property',
      nightlyRate: new Prisma.Decimal('100.00'),
    };

    it('creates a booking and snapshots the nightly rate and computed total amount', async () => {
      propertyService.getEntityBySlug.mockResolvedValue(property);
      bookingRepository.create.mockResolvedValue({
        slug: 'ABCD1234',
        checkInDate: new Date('2026-09-01'),
        checkOutDate: new Date('2026-09-04'),
        nightlyRate: new Prisma.Decimal('100.00'),
        totalAmount: new Prisma.Decimal('300.00'),
        paymentStatus: 'done',
        createdAt: new Date('2026-08-01'),
      });

      const dto = await service.createBooking({
        guestId: 1n,
        propertySlug: 'a-property',
        checkInDate: new Date('2026-09-01'),
        checkOutDate: new Date('2026-09-04'),
      });

      expect(bookingRepository.create).toHaveBeenCalledTimes(1);
      const [callArgs] = bookingRepository.create.mock.calls[0] as [
        {
          guestId: bigint;
          propertyId: bigint;
          checkInDate: Date;
          checkOutDate: Date;
          nightlyRate: Prisma.Decimal;
          totalAmount: Prisma.Decimal;
          paymentStatus: string;
        },
      ];
      expect(callArgs.guestId).toBe(1n);
      expect(callArgs.propertyId).toBe(5n);
      expect(callArgs.nightlyRate.toString()).toBe('100');
      expect(callArgs.totalAmount.toString()).toBe('300');
      expect(callArgs.paymentStatus).toBe('done');
      expect(dto.slug).toBe('ABCD1234');
      expect(dto.propertySlug).toBe('a-property');
      expect(dto.nightlyRate).toBe('100');
      expect(dto.totalAmount).toBe('300');
      expect(dto.paymentStatus).toBe('done');
    });

    it('throws NotFoundException when the property does not exist', async () => {
      propertyService.getEntityBySlug.mockResolvedValue(null);

      await expect(
        service.createBooking({
          guestId: 1n,
          propertySlug: 'missing',
          checkInDate: new Date('2026-09-01'),
          checkOutDate: new Date('2026-09-04'),
        }),
      ).rejects.toThrow(NotFoundException);
      expect(bookingRepository.create).not.toHaveBeenCalled();
    });

    it('translates a BookingUnavailableError from the repository into a 409 Conflict', async () => {
      propertyService.getEntityBySlug.mockResolvedValue(property);
      bookingRepository.create.mockRejectedValue(new BookingUnavailableError());

      await expect(
        service.createBooking({
          guestId: 1n,
          propertySlug: 'a-property',
          checkInDate: new Date('2026-09-01'),
          checkOutDate: new Date('2026-09-04'),
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
