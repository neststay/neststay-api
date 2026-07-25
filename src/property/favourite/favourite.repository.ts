import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { FavouritePropertyModel } from '../../../generated/prisma/models/FavouriteProperty.js';

@Injectable()
export class FavouriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndProperty(
    userId: string,
    propertyId: bigint,
  ): Promise<FavouritePropertyModel | null> {
    return this.prisma.favouriteProperty.findFirst({
      where: { userId, propertyId },
    });
  }

  async create(
    userId: string,
    propertyId: bigint,
  ): Promise<FavouritePropertyModel> {
    return this.prisma.favouriteProperty.create({
      data: { userId, propertyId },
    });
  }

  async delete(id: bigint): Promise<void> {
    await this.prisma.favouriteProperty.delete({ where: { id } });
  }
}
