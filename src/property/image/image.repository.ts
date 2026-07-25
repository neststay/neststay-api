import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ImageModel } from '../../../generated/prisma/models/Image.js';

@Injectable()
export class ImageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create({
    propertyId,
    url,
    order,
  }: {
    propertyId: bigint;
    url: string;
    order: number;
  }): Promise<ImageModel> {
    return this.prisma.image.create({
      data: { propertyId, url, order },
    });
  }

  async findByIdAndPropertyId(
    id: bigint,
    propertyId: bigint,
  ): Promise<ImageModel | null> {
    return this.prisma.image.findFirst({
      where: { id, propertyId },
    });
  }

  async delete(id: bigint): Promise<void> {
    await this.prisma.image.delete({ where: { id } });
  }
}
