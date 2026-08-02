import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ApiEnvelopeResponse } from '../common/swagger/api-envelope-response.decorator.js';
import { ApiHttpErrorResponse } from '../common/swagger/api-http-error-response.decorator.js';
import { ResponseApiDto } from '../common/dto/response-api.dto.js';
import {
  CreateBookingDto,
  CreateBookingSchema,
} from './dto/create-booking.dto.js';
import { BookingResponseDto } from './dto/booking-response.dto.js';
import { BookingService } from './booking.service.js';

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a booking for a property and date range' })
  @ApiEnvelopeResponse(201, 'Booking created successfully', BookingResponseDto)
  @ApiHttpErrorResponse(401, 'Unauthorized', 'Unauthorized')
  @ApiHttpErrorResponse(404, 'Not Found', 'Property not found')
  @ApiHttpErrorResponse(409, 'Conflict', 'Requested dates are unavailable')
  @ApiHttpErrorResponse(422, 'Unprocessable Entity', 'Validation failed')
  async create(
    @Body() body: CreateBookingDto,
    @CurrentUser() guestId: bigint,
  ): Promise<ResponseApiDto<BookingResponseDto>> {
    const result = CreateBookingSchema.safeParse(body);
    if (!result.success) {
      throw new UnprocessableEntityException(
        result.error.issues.map((e) => e.message),
      );
    }

    const data = await this.bookingService.createBooking({
      guestId,
      propertySlug: result.data.propertySlug,
      checkInDate: result.data.checkInDate,
      checkOutDate: result.data.checkOutDate,
    });
    return { success: true, message: 'Booking created successfully', data };
  }
}
