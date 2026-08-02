import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { BookingRepository } from './booking.repository.js';

describe('BookingRepository', () => {
  let repository: BookingRepository;
  let findFirstMock: jest.Mock;

  beforeEach(async () => {
    findFirstMock = jest.fn();

    const prisma = {
      propertyUnavailability: {
        findFirst: findFirstMock,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(BookingRepository);
  });

  describe('findOverlappingUnavailability', () => {
    it('queries with exclusive-checkout overlap semantics (back-to-back ranges do not conflict)', async () => {
      findFirstMock.mockResolvedValue(null);
      const startDate = new Date('2026-09-01');
      const endDate = new Date('2026-09-05');

      await repository.findOverlappingUnavailability({
        propertyId: 1n,
        startDate,
        endDate,
      });

      expect(findFirstMock).toHaveBeenCalledWith({
        where: {
          propertyId: 1n,
          startDate: { lt: endDate },
          endDate: { gt: startDate },
        },
      });
    });

    it('returns the overlapping row when one exists', async () => {
      const overlapping = {
        id: 1n,
        propertyId: 1n,
        bookingId: 1n,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-05'),
        source: 'booking',
        createdAt: new Date(),
      };
      findFirstMock.mockResolvedValue(overlapping);

      const result = await repository.findOverlappingUnavailability({
        propertyId: 1n,
        startDate: new Date('2026-09-03'),
        endDate: new Date('2026-09-06'),
      });

      expect(result).toBe(overlapping);
    });

    it('returns null when no overlap exists', async () => {
      findFirstMock.mockResolvedValue(null);

      const result = await repository.findOverlappingUnavailability({
        propertyId: 1n,
        startDate: new Date('2026-09-10'),
        endDate: new Date('2026-09-12'),
      });

      expect(result).toBeNull();
    });
  });
});
