import { Injectable } from '@nestjs/common';
import { PaginatedResponseDto } from '../../common/pagination/paginated-response.dto.js';
import { mapToPaginatedResponse } from '../../common/pagination/pagination.helper.js';
import { PropertyService } from '../property.service.js';
import { PropertyResponseDto } from '../dto/property-response.dto.js';
import { FavouriteRepository } from './favourite.repository.js';
import { FavouriteResponseDto } from './dto/favourite-response.dto.js';

@Injectable()
export class FavouriteService {
  constructor(
    private readonly favouriteRepository: FavouriteRepository,
    private readonly propertyService: PropertyService,
  ) {}

  async listForUser({
    userId,
    page,
    limit,
  }: {
    userId: bigint;
    page: number;
    limit: number;
  }): Promise<PaginatedResponseDto<PropertyResponseDto>> {
    const result = await this.favouriteRepository.findPaginatedByUser({
      userId,
      page,
      limit,
    });
    return mapToPaginatedResponse(result, (favourite) => {
      const dto = this.propertyService.toResponseDto(favourite.property);
      dto.isFavourited = true;
      return dto;
    });
  }

  async toggle(slug: string, userId: bigint): Promise<FavouriteResponseDto> {
    const propertyId = await this.propertyService.getIdBySlug(slug);

    const existing = await this.favouriteRepository.findByUserAndProperty(
      userId,
      propertyId,
    );

    const isFavourite = !existing;
    if (existing) {
      await this.favouriteRepository.delete(existing.id);
    } else {
      await this.favouriteRepository.create(userId, propertyId);
    }

    const dto = new FavouriteResponseDto();
    dto.slug = slug;
    dto.isFavourite = isFavourite;
    return dto;
  }
}
