import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BookingUnavailableError } from './booking-unavailable.error.js';
import { BookingRepository } from './booking.repository.js';

describe('BookingRepository', () => {
  let repository: BookingRepository;
  let findFirstMock: jest.Mock;
  let transactionMock: jest.Mock;
  let bookingCreateMock: jest.Mock;
  let unavailabilityCreateMock: jest.Mock;

  beforeEach(async () => {
    findFirstMock = jest.fn();
    bookingCreateMock = jest.fn();
    unavailabilityCreateMock = jest.fn();
    transactionMock = jest.fn((callback: (tx: unknown) => unknown) =>
      callback({
        booking: { create: bookingCreateMock },
        propertyUnavailability: { create: unavailabilityCreateMock },
      }),
    );

    const prisma = {
      propertyUnavailability: {
        findFirst: findFirstMock,
      },
      $transaction: transactionMock,
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

  describe('create', () => {
    it('inserts the booking and its linked property_unavailability row in one transaction', async () => {
      const booking = {
        id: 10n,
        slug: 'ABCD1234',
        guestId: 1n,
        propertyId: 5n,
        checkInDate: new Date('2026-09-01'),
        checkOutDate: new Date('2026-09-05'),
        nightlyRate: new Prisma.Decimal('99.99'),
        totalAmount: new Prisma.Decimal('399.96'),
        paymentStatus: 'done',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      bookingCreateMock.mockResolvedValue(booking);
      unavailabilityCreateMock.mockResolvedValue({});

      const result = await repository.create({
        guestId: 1n,
        propertyId: 5n,
        checkInDate: new Date('2026-09-01'),
        checkOutDate: new Date('2026-09-05'),
        nightlyRate: new Prisma.Decimal('99.99'),
        totalAmount: new Prisma.Decimal('399.96'),
        paymentStatus: 'done',
      });

      expect(transactionMock).toHaveBeenCalledTimes(1);
      const [bookingCreateArgs] = bookingCreateMock.mock.calls[0] as [
        { data: { guestId: bigint; propertyId: bigint; slug: string } },
      ];
      expect(bookingCreateArgs.data.guestId).toBe(1n);
      expect(bookingCreateArgs.data.propertyId).toBe(5n);
      expect(typeof bookingCreateArgs.data.slug).toBe('string');
      expect(bookingCreateArgs.data.slug).toHaveLength(8);
      expect(unavailabilityCreateMock).toHaveBeenCalledWith({
        data: {
          propertyId: 5n,
          bookingId: booking.id,
          startDate: booking.checkInDate,
          endDate: booking.checkOutDate,
          source: 'booking',
        },
      });
      expect(result).toBe(booking);
    });

    it('translates a Postgres exclusion-violation error into a BookingUnavailableError', async () => {
      bookingCreateMock.mockResolvedValue({ id: 10n });
      const exclusionError = new Prisma.PrismaClientKnownRequestError(
        'Database error',
        {
          code: 'P2039',
          clientVersion: 'test',
          meta: {
            driverAdapterError: { cause: { originalCode: '23P01' } },
          },
        },
      );
      transactionMock.mockRejectedValue(exclusionError);

      await expect(
        repository.create({
          guestId: 1n,
          propertyId: 5n,
          checkInDate: new Date('2026-09-01'),
          checkOutDate: new Date('2026-09-05'),
          nightlyRate: new Prisma.Decimal('99.99'),
          totalAmount: new Prisma.Decimal('399.96'),
          paymentStatus: 'done',
        }),
      ).rejects.toThrow(BookingUnavailableError);
    });

    it('rethrows unrelated errors unchanged', async () => {
      const otherError = new Error('boom');
      transactionMock.mockRejectedValue(otherError);

      await expect(
        repository.create({
          guestId: 1n,
          propertyId: 5n,
          checkInDate: new Date('2026-09-01'),
          checkOutDate: new Date('2026-09-05'),
          nightlyRate: new Prisma.Decimal('99.99'),
          totalAmount: new Prisma.Decimal('399.96'),
          paymentStatus: 'done',
        }),
      ).rejects.toThrow('boom');
    });
  });
});
