import {
  CanActivate,
  ConflictException,
  ExecutionContext,
  INestApplication,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { BookingController } from './booking.controller.js';
import { BookingService } from './booking.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { BookingResponseDto } from './dto/booking-response.dto.js';

class AllowGuard implements CanActivate {
  constructor(private readonly userId: bigint) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user: { userId: bigint } }>();
    request.user = { userId: this.userId };
    return true;
  }
}

class DenyGuard implements CanActivate {
  canActivate(): boolean {
    throw new UnauthorizedException();
  }
}

function booking(slug: string): BookingResponseDto {
  return {
    slug,
    propertySlug: 'a-property',
    checkInDate: new Date('2026-09-01'),
    checkOutDate: new Date('2026-09-04'),
    nightlyRate: '100.00',
    totalAmount: '300.00',
    paymentStatus: 'done',
    createdAt: new Date(),
  };
}

interface BookingEnvelope {
  success: boolean;
  message: string;
  data: BookingResponseDto;
}

describe('BookingController - POST /bookings', () => {
  let app: INestApplication<App>;
  let bookingService: { createBooking: jest.Mock };

  async function createTestApp(guard: CanActivate): Promise<void> {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [{ provide: BookingService, useValue: bookingService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(guard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }

  beforeEach(() => {
    bookingService = { createBooking: jest.fn() };
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates a booking for the authenticated guest', async () => {
    bookingService.createBooking.mockResolvedValue(booking('ABCD1234'));
    await createTestApp(new AllowGuard(1n));

    const response = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        propertySlug: 'a-property',
        checkInDate: '2026-09-01',
        checkOutDate: '2026-09-04',
      })
      .expect(201);

    const body = response.body as BookingEnvelope;
    expect(bookingService.createBooking).toHaveBeenCalledWith({
      guestId: 1n,
      propertySlug: 'a-property',
      checkInDate: new Date('2026-09-01'),
      checkOutDate: new Date('2026-09-04'),
    });
    expect(body.data.slug).toBe('ABCD1234');
  });

  it('responds 401 for an unauthenticated request', async () => {
    await createTestApp(new DenyGuard());

    await request(app.getHttpServer())
      .post('/bookings')
      .send({
        propertySlug: 'a-property',
        checkInDate: '2026-09-01',
        checkOutDate: '2026-09-04',
      })
      .expect(401);

    expect(bookingService.createBooking).not.toHaveBeenCalled();
  });

  it('responds 422 for an invalid date range', async () => {
    await createTestApp(new AllowGuard(1n));

    await request(app.getHttpServer())
      .post('/bookings')
      .send({
        propertySlug: 'a-property',
        checkInDate: '2026-09-04',
        checkOutDate: '2026-09-01',
      })
      .expect(422);

    expect(bookingService.createBooking).not.toHaveBeenCalled();
  });

  it('responds 404 when the property does not exist', async () => {
    bookingService.createBooking.mockRejectedValue(
      new NotFoundException('Property missing not found'),
    );
    await createTestApp(new AllowGuard(1n));

    await request(app.getHttpServer())
      .post('/bookings')
      .send({
        propertySlug: 'missing',
        checkInDate: '2026-09-01',
        checkOutDate: '2026-09-04',
      })
      .expect(404);
  });

  it('responds 409 when the requested dates are unavailable', async () => {
    bookingService.createBooking.mockRejectedValue(
      new ConflictException('Requested dates are unavailable'),
    );
    await createTestApp(new AllowGuard(1n));

    await request(app.getHttpServer())
      .post('/bookings')
      .send({
        propertySlug: 'a-property',
        checkInDate: '2026-09-01',
        checkOutDate: '2026-09-04',
      })
      .expect(409);
  });
});
