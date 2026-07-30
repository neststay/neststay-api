import {
  Controller,
  Get,
  Query,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUserOptional } from '../auth/decorators/current-user-optional.decorator.js';
import { ApiEnvelopeResponse } from '../common/swagger/api-envelope-response.decorator.js';
import { ApiHttpErrorResponse } from '../common/swagger/api-http-error-response.decorator.js';
import { ResponseApiDto } from '../common/dto/response-api.dto.js';
import { SearchQueryDto, SearchQuerySchema } from './dto/search-query.dto.js';
import { SearchResponseDto } from './dto/search-response.dto.js';
import { SearchQueryService } from './search-query.service.js';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchQueryService: SearchQueryService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Search properties' })
  @ApiEnvelopeResponse(200, 'Search completed successfully', SearchResponseDto)
  @ApiHttpErrorResponse(422, 'Unprocessable Entity', 'Validation failed')
  async search(
    @Query() query: SearchQueryDto,
    @CurrentUserOptional() userId: bigint | null,
  ): Promise<ResponseApiDto<SearchResponseDto>> {
    const result = SearchQuerySchema.safeParse(query);
    if (!result.success) {
      throw new UnprocessableEntityException(
        result.error.issues.map((e) => e.message),
      );
    }

    const {
      q,
      page,
      limit,
      locationName,
      placeTypeName,
      minNightlyRate,
      maxNightlyRate,
      numberOfGuests,
      numberOfBedrooms,
      numberOfBathrooms,
    } = result.data;

    const data = await this.searchQueryService.search({
      query: q,
      filters: {
        locationName,
        placeTypeName,
        minNightlyRate,
        maxNightlyRate,
        numberOfGuests,
        numberOfBedrooms,
        numberOfBathrooms,
      },
      page,
      limit,
      userId,
    });

    return { success: true, message: 'Search completed successfully', data };
  }
}
