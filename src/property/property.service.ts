import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResponseDto } from '../common/pagination/paginated-response.dto.js';
import { mapToPaginatedResponse } from '../common/pagination/pagination.helper.js';
import { PropertyModel } from '../../generated/prisma/models/Property.js';
import { ImageModel } from '../../generated/prisma/models/Image.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { PropertyResponseDto } from './dto/property-response.dto.js';
import { PropertyImageDto } from './dto/property-image.dto.js';
import { PropertyRepository } from './property.repository.js';

@Injectable()
export class PropertyService {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async create(
    data: CreatePropertyDto,
    hostId: bigint,
  ): Promise<PropertyResponseDto> {
    const property = await this.propertyRepository.create({ data, hostId });
    return this.toResponseDto(property);
  }

  async getBySlug(slug: string): Promise<PropertyResponseDto> {
    const property = await this.propertyRepository.findBySlug({ slug });
    if (!property) throw new NotFoundException(`Property ${slug} not found`);
    return this.toResponseDto(property);
  }

  async getIdBySlug(slug: string): Promise<bigint> {
    const property = await this.propertyRepository.findBySlug({ slug });
    if (!property) throw new NotFoundException(`Property ${slug} not found`);
    return property.id;
  }

  async getOwnedPropertyIdBySlug(
    slug: string,
    hostId: bigint,
  ): Promise<bigint> {
    const property = await this.getOwnedPropertyOrThrow(slug, hostId);
    return property.id;
  }

  async updateBySlug(
    slug: string,
    data: UpdatePropertyDto,
    hostId: bigint,
  ): Promise<PropertyResponseDto> {
    const property = await this.getOwnedPropertyOrThrow(slug, hostId);
    const updated = await this.propertyRepository.update({
      id: property.id,
      data,
    });
    return this.toResponseDto(updated);
  }

  async deleteBySlug(slug: string, hostId: bigint): Promise<void> {
    const property = await this.getOwnedPropertyOrThrow(slug, hostId);
    await this.propertyRepository.delete({ id: property.id });
  }

  async listByLocation({
    locationId,
    page,
    limit,
  }: {
    locationId: number;
    page: number;
    limit: number;
  }): Promise<PaginatedResponseDto<PropertyResponseDto>> {
    const result = await this.propertyRepository.findAllPaginatedByLocation({
      locationId,
      page,
      limit,
    });
    return mapToPaginatedResponse(result, (p) => this.toResponseDto(p));
  }

  private async getOwnedPropertyOrThrow(
    slug: string,
    hostId: bigint,
  ): Promise<PropertyModel> {
    const property = await this.propertyRepository.findBySlug({ slug });
    if (!property || property.hostId !== hostId) {
      throw new NotFoundException(`Property ${slug} not found`);
    }
    return property;
  }

  toResponseDto(
    property: PropertyModel & { images?: ImageModel[] },
  ): PropertyResponseDto {
    const dto = new PropertyResponseDto();
    dto.slug = property.slug;
    dto.name = property.name;
    dto.description = property.description;
    dto.nightlyRate = property.nightlyRate.toString();
    dto.numberOfGuests = property.numberOfGuests;
    dto.numberOfBedrooms = property.numberOfBedrooms;
    dto.numberOfBathrooms = property.numberOfBathrooms;
    dto.createdAt = property.createdAt;
    dto.updatedAt = property.updatedAt;
    dto.images = (property.images ?? []).map((image) => this.toImageDto(image));
    return dto;
  }

  private toImageDto(image: ImageModel): PropertyImageDto {
    const dto = new PropertyImageDto();
    dto.url = image.url;
    dto.order = image.order;
    return dto;
  }
}
