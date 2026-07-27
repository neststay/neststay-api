import { Injectable } from '@nestjs/common';
import { PageNumberPaginationMeta } from 'prisma-extension-pagination';
import { PrismaService } from '../../prisma/prisma.service.js';
import { FavouritePropertyModel } from '../../../generated/prisma/models/FavouriteProperty.js';
import { PropertyWithImages } from '../property.repository.js';

export type FavouriteWithProperty = FavouritePropertyModel & {
  property: PropertyWithImages;
};

@Injectable()
export class FavouriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndProperty(
    userId: bigint,
    propertyId: bigint,
  ): Promise<FavouritePropertyModel | null> {
    return this.prisma.favouriteProperty.findFirst({
      where: { userId, propertyId },
    });
  }

  async create(
    userId: bigint,
    propertyId: bigint,
  ): Promise<FavouritePropertyModel> {
    return this.prisma.favouriteProperty.create({
      data: { userId, propertyId },
    });
  }

  async delete(id: bigint): Promise<void> {
    await this.prisma.favouriteProperty.delete({ where: { id } });
  }

  async findPaginatedByUser({
    userId,
    page,
    limit,
  }: {
    userId: bigint;
    page: number;
    limit: number;
  }): Promise<[FavouriteWithProperty[], PageNumberPaginationMeta<true>]> {
    return this.prisma.extendedClient.favouriteProperty
      .paginate({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          property: { include: { images: { orderBy: { order: 'asc' } } } },
        },
      })
      .withPages({ page, limit });
  }
}
