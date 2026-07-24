import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { PageNumberPaginationMeta } from 'prisma-extension-pagination';
import { PropertyModel } from '../../generated/prisma/models/Property.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';

@Injectable()
export class PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug({ slug }: { slug: string }): Promise<PropertyModel | null> {
    return this.prisma.property.findUnique({ where: { slug } });
  }

  async findByIdAndHostId({
    id,
    hostId,
  }: {
    id: bigint;
    hostId: string;
  }): Promise<PropertyModel | null> {
    return this.prisma.property.findFirst({ where: { id, hostId } });
  }

  async findAllPaginatedByLocation({
    locationId,
    page,
    limit,
  }: {
    locationId: number;
    page: number;
    limit: number;
  }): Promise<[PropertyModel[], PageNumberPaginationMeta<true>]> {
    return this.prisma.extendedClient.property
      .paginate({ where: { locationId }, orderBy: { id: 'desc' } })
      .withPages({ page, limit }) as Promise<
      [PropertyModel[], PageNumberPaginationMeta<true>]
    >;
  }

  async create({
    data,
    hostId,
  }: {
    data: CreatePropertyDto;
    hostId: string;
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
}
