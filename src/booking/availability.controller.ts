import {
  Controller,
  Get,
  Param,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiEnvelopeResponse } from '../common/swagger/api-envelope-response.decorator.js';
import { ApiHttpErrorResponse } from '../common/swagger/api-http-error-response.decorator.js';
import { ResponseApiDto } from '../common/dto/response-api.dto.js';
import {
  AvailabilityQueryDto,
  AvailabilityQuerySchema,
} from './dto/availability-query.dto.js';
import { AvailabilityResponseDto } from './dto/availability-response.dto.js';
import { BookingService } from './booking.service.js';

@ApiTags('availability')
@Controller('properties/:slug/availability')
export class AvailabilityController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @ApiOperation({ summary: 'Check property availability for a date range' })
  @ApiEnvelopeResponse(
    200,
    'Availability fetched successfully',
    AvailabilityResponseDto,
  )
  @ApiHttpErrorResponse(404, 'Not Found', 'Property not found')
  @ApiHttpErrorResponse(422, 'Unprocessable Entity', 'Validation failed')
  async check(
    @Param('slug') slug: string,
    @Query() query: AvailabilityQueryDto,
  ): Promise<ResponseApiDto<AvailabilityResponseDto>> {
    const result = AvailabilityQuerySchema.safeParse(query);
    if (!result.success) {
      throw new UnprocessableEntityException(
        result.error.issues.map((e) => e.message),
      );
    }

    const data = await this.bookingService.checkAvailability({
      slug,
      startDate: result.data.startDate,
      endDate: result.data.endDate,
    });
    return {
      success: true,
      message: 'Availability fetched successfully',
      data,
    };
  }
}
