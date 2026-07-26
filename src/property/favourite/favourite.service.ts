import { Injectable } from '@nestjs/common';
import { PropertyService } from '../property.service.js';
import { FavouriteRepository } from './favourite.repository.js';
import { FavouriteResponseDto } from './dto/favourite-response.dto.js';

@Injectable()
export class FavouriteService {
  constructor(
    private readonly favouriteRepository: FavouriteRepository,
    private readonly propertyService: PropertyService,
  ) {}

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
