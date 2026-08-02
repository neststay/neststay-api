import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { PageNumberPaginationMeta } from 'prisma-extension-pagination';
import { PropertyModel } from '../../generated/prisma/models/Property.js';
import { ImageModel } from '../../generated/prisma/models/Image.js';
import { FavouritePropertyModel } from '../../generated/prisma/models/FavouriteProperty.js';
import { LocationModel } from '../../generated/prisma/models/Location.js';
import { PlaceTypeModel } from '../../generated/prisma/models/PlaceType.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';

export type PropertyWithImages = PropertyModel & {
  images: ImageModel[];
  favouriteProperties?: FavouritePropertyModel[];
};

export type PropertyWithRelations = PropertyWithImages & {
  location: LocationModel;
  placeType: PlaceTypeModel;
};

@Injectable()
export class PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug({
    slug,
  }: {
    slug: string;
  }): Promise<PropertyWithRelations | null> {
    return this.prisma.property.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { order: 'asc' } },
        location: true,
        placeType: true,
      },
    });
  }

  async findByIdAndHostId({
    id,
    hostId,
  }: {
    id: bigint;
    hostId: bigint;
  }): Promise<PropertyModel | null> {
    return this.prisma.property.findFirst({ where: { id, hostId } });
  }

  async findAllPaginatedByLocation({
    locationId,
    page,
    limit,
    userId,
  }: {
    locationId: number;
    page: number;
    limit: number;
    userId?: bigint | null;
  }): Promise<[PropertyWithImages[], PageNumberPaginationMeta<true>]> {
    return this.prisma.extendedClient.property
      .paginate({
        where: { locationId, isActive: true },
        orderBy: { id: 'desc' },
        include: {
          images: { orderBy: { order: 'asc' } },
          ...(userId ? { favouriteProperties: { where: { userId } } } : {}),
        },
      })
      .withPages({ page, limit });
  }

  async create({
    data,
    hostId,
  }: {
    data: CreatePropertyDto;
    hostId: bigint;
  }): Promise<PropertyModel> {
    return this.prisma.property.create({
      data: {
        slug: ulid(),
        hostId,
        locationId: data.locationId,
        placeTypeId: data.placeTypeId,
        nightlyRate: data.nightlyRate,
        name: data.name,
        description: data.description,
        numberOfGuests: data.numberOfGuests,
        numberOfBedrooms: data.numberOfBedrooms,
        numberOfBathrooms: data.numberOfBathrooms,
      },
    });
  }

  async update({
    id,
    data,
  }: {
    id: bigint;
    data: UpdatePropertyDto;
  }): Promise<PropertyModel> {
    return this.prisma.property.update({
      where: { id },
      data,
    });
  }

  async delete({ id }: { id: bigint }): Promise<void> {
    await this.prisma.property.delete({ where: { id } });
  }

  async activate({ id }: { id: bigint }): Promise<PropertyModel> {
    return this.prisma.property.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
