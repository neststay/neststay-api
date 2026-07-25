import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ApiEnvelopeResponse } from '../common/swagger/api-envelope-response.decorator.js';
import { ApiHttpErrorResponse } from '../common/swagger/api-http-error-response.decorator.js';
import { ResponseApiDto } from '../common/dto/response-api.dto.js';
import {
  CreatePropertyDto,
  CreatePropertySchema,
} from './dto/create-property.dto.js';
import {
  UpdatePropertyDto,
  UpdatePropertySchema,
} from './dto/update-property.dto.js';
import {
  ListPropertyQueryDto,
  ListPropertyQuerySchema,
} from './dto/list-property-query.dto.js';
import { PropertyResponseDto } from './dto/property-response.dto.js';
import { PaginatedPropertyListDto } from './dto/paginated-property-list.dto.js';
import { PropertyService } from './property.service.js';

@ApiTags('properties')
@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a property' })
  @ApiEnvelopeResponse(
    201,
    'Property created successfully',
    PropertyResponseDto,
  )
  @ApiHttpErrorResponse(401, 'Unauthorized', 'Unauthorized')
  @ApiHttpErrorResponse(422, 'Unprocessable Entity', 'Validation failed')
  async create(
    @Body() body: CreatePropertyDto,
    @CurrentUser() hostId: string,
  ): Promise<ResponseApiDto<PropertyResponseDto>> {
    const result = CreatePropertySchema.safeParse(body);
    if (!result.success) {
      throw new UnprocessableEntityException(
        result.error.issues.map((e) => e.message),
      );
    }

    const data = await this.propertyService.create(result.data, hostId);
    return { success: true, message: 'Property created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'List properties for a location' })
  @ApiEnvelopeResponse(
    200,
    'Properties fetched successfully',
    PaginatedPropertyListDto,
  )
  @ApiHttpErrorResponse(422, 'Unprocessable Entity', 'Validation failed')
  async findAll(
    @Query() query: ListPropertyQueryDto,
  ): Promise<ResponseApiDto<PaginatedPropertyListDto>> {
    const result = ListPropertyQuerySchema.safeParse(query);
    if (!result.success) {
      throw new UnprocessableEntityException(
        result.error.issues.map((e) => e.message),
      );
    }

    const data = await this.propertyService.listByLocation(result.data);
    return {
      success: true,
      message: 'Properties fetched successfully',
      data: data,
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a property by slug' })
  @ApiEnvelopeResponse(
    200,
    'Property fetched successfully',
    PropertyResponseDto,
  )
  @ApiHttpErrorResponse(404, 'Not Found', 'Property not found')
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<ResponseApiDto<PropertyResponseDto>> {
    const data = await this.propertyService.getBySlug(slug);
    return { success: true, message: 'Property fetched successfully', data };
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a property owned by the authenticated user',
  })
  @ApiEnvelopeResponse(
    200,
    'Property updated successfully',
    PropertyResponseDto,
  )
  @ApiHttpErrorResponse(401, 'Unauthorized', 'Unauthorized')
  @ApiHttpErrorResponse(404, 'Not Found', 'Property not found')
  @ApiHttpErrorResponse(422, 'Unprocessable Entity', 'Validation failed')
  async update(
    @Param('slug') slug: string,
    @Body() body: UpdatePropertyDto,
    @CurrentUser() hostId: string,
  ): Promise<ResponseApiDto<PropertyResponseDto>> {
    const result = UpdatePropertySchema.safeParse(body);
    if (!result.success) {
      throw new UnprocessableEntityException(
        result.error.issues.map((e) => e.message),
      );
    }

    const data = await this.propertyService.updateBySlug(
      slug,
      result.data,
      hostId,
    );
    return { success: true, message: 'Property updated successfully', data };
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a property owned by the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Property deleted successfully' })
  @ApiHttpErrorResponse(401, 'Unauthorized', 'Unauthorized')
  @ApiHttpErrorResponse(404, 'Not Found', 'Property not found')
  async remove(
    @Param('slug') slug: string,
    @CurrentUser() hostId: string,
  ): Promise<ResponseApiDto<null>> {
    await this.propertyService.deleteBySlug(slug, hostId);
    return {
      success: true,
      message: 'Property deleted successfully',
      data: null,
    };
  }
}
