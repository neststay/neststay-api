import { Injectable } from '@nestjs/common';
import { PropertyService } from '../property.service.js';
import { ImageModel } from '../../../generated/prisma/models/Image.js';
import { ImageRepository } from './image.repository.js';
import { CreateImageDto } from './dto/create-image.dto.js';
import { ImageResponseDto } from './dto/image-response.dto.js';

@Injectable()
export class ImageService {
  constructor(
    private readonly imageRepository: ImageRepository,
    private readonly propertyService: PropertyService,
  ) {}

  async addImage(
    slug: string,
    hostId: string,
    data: CreateImageDto,
  ): Promise<ImageResponseDto> {
    const propertyId = await this.propertyService.getOwnedPropertyIdBySlug(
      slug,
      hostId,
    );
    const image = await this.imageRepository.create({
      propertyId,
      url: data.url,
      order: data.order ?? 0,
    });
    return this.toDto(image);
  }

  private toDto(image: ImageModel): ImageResponseDto {
    const dto = new ImageResponseDto();
    dto.id = image.id.toString();
    dto.url = image.url;
    dto.order = image.order;
    dto.createdAt = image.createdAt;
    dto.updatedAt = image.updatedAt;
    return dto;
  }
}
