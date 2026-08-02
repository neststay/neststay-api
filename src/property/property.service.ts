import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginatedResponseDto } from '../common/pagination/paginated-response.dto.js';
import { mapToPaginatedResponse } from '../common/pagination/pagination.helper.js';
import { PropertyModel } from '../../generated/prisma/models/Property.js';
import { ImageModel } from '../../generated/prisma/models/Image.js';
import { FavouritePropertyModel } from '../../generated/prisma/models/FavouriteProperty.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { PropertyResponseDto } from './dto/property-response.dto.js';
import { PropertyImageDto } from './dto/property-image.dto.js';
import {
  PropertyRepository,
  PropertyWithRelations,
} from './property.repository.js';
import {
  PROPERTY_ACTIVATED_EVENT,
  PROPERTY_CREATED_EVENT,
  PROPERTY_DEACTIVATED_EVENT,
} from './property.constants.js';

@Injectable()
export class PropertyService {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    data: CreatePropertyDto,
    hostId: bigint,
  ): Promise<PropertyResponseDto> {
    const property = await this.propertyRepository.create({ data, hostId });

    this.eventEmitter.emit(PROPERTY_CREATED_EVENT, { slug: property.slug });

    return this.toResponseDto(property);
  }

  async getBySlug(slug: string): Promise<PropertyResponseDto> {
    const property = await this.propertyRepository.findBySlug({ slug });
    if (!property) throw new NotFoundException(`Property ${slug} not found`);
    return this.toResponseDto(property);
  }

  // Raw entity for internal consumers (e.g. search indexing) needing identity fields PropertyResponseDto omits.
  async getEntityBySlug(slug: string): Promise<PropertyWithRelations | null> {
    return this.propertyRepository.findBySlug({ slug });
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

  async activateBySlug(
    slug: string,
    hostId: bigint,
  ): Promise<PropertyResponseDto> {
    const property = await this.getOwnedPropertyOrThrow(slug, hostId);
    const activated = await this.propertyRepository.activate({
      id: property.id,
    });

    this.eventEmitter.emit(PROPERTY_ACTIVATED_EVENT, { slug: activated.slug });

    return this.toResponseDto(activated);
  }

  async deactivateBySlug(
    slug: string,
    hostId: bigint,
  ): Promise<PropertyResponseDto> {
    const property = await this.getOwnedPropertyOrThrow(slug, hostId);
    const deactivated = await this.propertyRepository.deactivate({
      id: property.id,
    });

    this.eventEmitter.emit(PROPERTY_DEACTIVATED_EVENT, {
      slug: deactivated.slug,
    });

    return this.toResponseDto(deactivated);
  }

  async deleteBySlug(slug: string, hostId: bigint): Promise<void> {
    const property = await this.getOwnedPropertyOrThrow(slug, hostId);
    await this.propertyRepository.delete({ id: property.id });
  }

  async listByLocation({
    locationId,
    page,
    limit,
    userId,
  }: {
    locationId: number;
    page: number;
    limit: number;
    userId?: bigint | null;
  }): Promise<PaginatedResponseDto<PropertyResponseDto>> {
    const result = await this.propertyRepository.findAllPaginatedByLocation({
      locationId,
      page,
      limit,
      userId,
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
    property: PropertyModel & {
      images?: ImageModel[];
      favouriteProperties?: FavouritePropertyModel[];
    },
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
    dto.isFavourited = (property.favouriteProperties ?? []).length > 0;
    dto.isActive = property.isActive;
    return dto;
  }

  private toImageDto(image: ImageModel): PropertyImageDto {
    const dto = new PropertyImageDto();
    dto.url = image.url;
    dto.order = image.order;
    return dto;
  }
}
