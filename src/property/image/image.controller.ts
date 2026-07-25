import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { ApiEnvelopeResponse } from '../../common/swagger/api-envelope-response.decorator.js';
import { ApiHttpErrorResponse } from '../../common/swagger/api-http-error-response.decorator.js';
import { ResponseApiDto } from '../../common/dto/response-api.dto.js';
import { CreateImageDto, CreateImageSchema } from './dto/create-image.dto.js';
import { ImageResponseDto } from './dto/image-response.dto.js';
import { ImageService } from './image.service.js';

@ApiTags('images')
@Controller('properties/:slug/images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add an image to a property owned by the authenticated user',
  })
  @ApiEnvelopeResponse(201, 'Image added successfully', ImageResponseDto)
  @ApiHttpErrorResponse(401, 'Unauthorized', 'Unauthorized')
  @ApiHttpErrorResponse(404, 'Not Found', 'Property not found')
  @ApiHttpErrorResponse(422, 'Unprocessable Entity', 'Validation failed')
  async create(
    @Param('slug') slug: string,
    @Body() body: CreateImageDto,
    @CurrentUser() hostId: string,
  ): Promise<ResponseApiDto<ImageResponseDto>> {
    const result = CreateImageSchema.safeParse(body);
    if (!result.success) {
      throw new UnprocessableEntityException(
        result.error.issues.map((e) => e.message),
      );
    }

    const data = await this.imageService.addImage(slug, hostId, result.data);
    return { success: true, message: 'Image added successfully', data };
  }
}
