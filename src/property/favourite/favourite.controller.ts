import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { ApiEnvelopeResponse } from '../../common/swagger/api-envelope-response.decorator.js';
import { ApiHttpErrorResponse } from '../../common/swagger/api-http-error-response.decorator.js';
import { ResponseApiDto } from '../../common/dto/response-api.dto.js';
import { FavouriteResponseDto } from './dto/favourite-response.dto.js';
import { FavouriteService } from './favourite.service.js';

@ApiTags('favourites')
@Controller('properties/:slug/favourite')
export class FavouriteController {
  constructor(private readonly favouriteService: FavouriteService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Toggle the authenticated user's favourite status for a property",
  })
  @ApiEnvelopeResponse(
    200,
    'Favourite status toggled successfully',
    FavouriteResponseDto,
  )
  @ApiHttpErrorResponse(401, 'Unauthorized', 'Unauthorized')
  @ApiHttpErrorResponse(404, 'Not Found', 'Property not found')
  async toggle(
    @Param('slug') slug: string,
    @CurrentUser() userId: string,
  ): Promise<ResponseApiDto<FavouriteResponseDto>> {
    const data = await this.favouriteService.toggle(slug, userId);
    const message = data.isFavourite
      ? 'Property added to favourites'
      : 'Property removed from favourites';

    return { success: true, message, data };
  }
}
