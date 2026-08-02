import { PropertyService } from '../property/property.service.js';
import { BookingRepository } from './booking.repository.js';
import { BookingService } from './booking.service.js';

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepository: {
    findOverlappingUnavailability: jest.Mock;
  };
  let propertyService: {
    getIdBySlug: jest.Mock;
  };

  beforeEach(() => {
    bookingRepository = {
      findOverlappingUnavailability: jest.fn(),
    };
    propertyService = {
      getIdBySlug: jest.fn(),
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
});
