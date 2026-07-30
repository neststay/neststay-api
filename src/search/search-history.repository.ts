import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SearchHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create({
    searchId,
    userId,
    query,
  }: {
    searchId: string;
    userId: bigint | null;
    query: string;
  }): Promise<{ searchId: string }> {
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
