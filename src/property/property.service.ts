import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResponseDto } from '../common/pagination/paginated-response.dto.js';
import { mapToPaginatedResponse } from '../common/pagination/pagination.helper.js';
import { PropertyModel } from '../../generated/prisma/models/Property.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { PropertyResponseDto } from './dto/property-response.dto.js';
import { PropertyRepository } from './property.repository.js';

@Injectable()
export class PropertyService {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async create(
    data: CreatePropertyDto,
    hostId: string,
  ): Promise<PropertyResponseDto> {
    const property = await this.propertyRepository.create({ data, hostId });
    return this.toDto(property);
  }

  async getBySlug(slug: string): Promise<PropertyResponseDto> {
    const property = await this.propertyRepository.findBySlug({ slug });
    if (!property) throw new NotFoundException(`Property ${slug} not found`);
    return this.toDto(property);
  }

  async getIdBySlug(slug: string): Promise<bigint> {
    const property = await this.propertyRepository.findBySlug({ slug });
    if (!property) throw new NotFoundException(`Property ${slug} not found`);
    return property.id;
  }

  async getOwnedPropertyIdBySlug(
    slug: string,
    hostId: string,
  ): Promise<bigint> {
    const property = await this.getOwnedPropertyOrThrow(slug, hostId);
    return property.id;
  }

  async updateBySlug(
    slug: string,
    data: UpdatePropertyDto,
    hostId: string,
  ): Promise<PropertyResponseDto> {
    const property = await this.getOwnedPropertyOrThrow(slug, hostId);
    const updated = await this.propertyRepository.update({
      id: property.id,
      data,
    });
    return this.toDto(updated);
  }

  async deleteBySlug(slug: string, hostId: string): Promise<void> {
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
    return mapToPaginatedResponse(result, (p) => this.toDto(p));
  }

  private async getOwnedPropertyOrThrow(
    slug: string,
    hostId: string,
  ): Promise<PropertyModel> {
    const property = await this.propertyRepository.findBySlug({ slug });
    if (!property || property.hostId !== hostId) {
      throw new NotFoundException(`Property ${slug} not found`);
    }
    return property;
  }

  private toDto(property: PropertyModel): PropertyResponseDto {
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
    return dto;
  }
}
