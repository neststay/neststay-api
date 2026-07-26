import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { ApiEnvelopeResponse } from '../../common/swagger/api-envelope-response.decorator.js';
import { ApiHttpErrorResponse } from '../../common/swagger/api-http-error-response.decorator.js';
import { ResponseApiDto } from '../../common/dto/response-api.dto.js';
import { CreateImageDto, CreateImageSchema } from './dto/create-image.dto.js';
import {
  ReorderImagesDto,
  ReorderImagesSchema,
} from './dto/reorder-images.dto.js';
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
    @CurrentUser() hostId: bigint,
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

  @Delete(':imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete an image from a property owned by the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiHttpErrorResponse(401, 'Unauthorized', 'Unauthorized')
  @ApiHttpErrorResponse(404, 'Not Found', 'Image not found')
  async remove(
    @Param('slug') slug: string,
    @Param('imageId') imageId: string,
    @CurrentUser() hostId: bigint,
  ): Promise<ResponseApiDto<null>> {
    await this.imageService.deleteImage(slug, hostId, imageId);
    return {
      success: true,
      message: 'Image deleted successfully',
      data: null,
    };
  }

  @Patch('order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Reorder images for a property owned by the authenticated user by supplying the full ordered list of image ids',
  })
  @ApiResponse({ status: 200, description: 'Images reordered successfully' })
  @ApiHttpErrorResponse(401, 'Unauthorized', 'Unauthorized')
  @ApiHttpErrorResponse(404, 'Not Found', 'Property not found')
  @ApiHttpErrorResponse(422, 'Unprocessable Entity', 'Validation failed')
  async reorder(
    @Param('slug') slug: string,
    @Body() body: ReorderImagesDto,
    @CurrentUser() hostId: bigint,
  ): Promise<ResponseApiDto<null>> {
    const result = ReorderImagesSchema.safeParse(body);
    if (!result.success) {
      throw new UnprocessableEntityException(
        result.error.issues.map((e) => e.message),
      );
    }

    await this.imageService.reorder(slug, hostId, result.data.imageIds);
    return {
      success: true,
      message: 'Images reordered successfully',
      data: null,
    };
  }
}
