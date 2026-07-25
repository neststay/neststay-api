import { Injectable, NotFoundException } from '@nestjs/common';
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

  async deleteImage(
    slug: string,
    hostId: string,
    imageId: string,
  ): Promise<void> {
    const propertyId = await this.propertyService.getOwnedPropertyIdBySlug(
      slug,
      hostId,
    );

    let id: bigint;
    try {
      id = BigInt(imageId);
    } catch {
      throw new NotFoundException(`Image ${imageId} not found`);
    }

    const image = await this.imageRepository.findByIdAndPropertyId(
      id,
      propertyId,
    );
    if (!image) {
      throw new NotFoundException(`Image ${imageId} not found`);
    }

    await this.imageRepository.delete(id);
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
