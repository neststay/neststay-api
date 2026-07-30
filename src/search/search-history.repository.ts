import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SearchHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create({
    userId,
    query,
  }: {
    userId: bigint | null;
    query: string;
  }): Promise<{ searchId: string }> {
    const searchId = ulid();

    await this.prisma.searchHistory.create({
      data: {
        searchId,
        userId,
        query,
      },
    });

    return { searchId };
  }
}
