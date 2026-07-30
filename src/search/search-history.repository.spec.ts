import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { SearchHistoryRepository } from './search-history.repository.js';

jest.mock('ulid', () => ({
  ulid: jest.fn(() => 'generated-search-id'),
}));

describe('SearchHistoryRepository', () => {
  let repository: SearchHistoryRepository;
  let createMock: jest.Mock;

  beforeEach(async () => {
    createMock = jest.fn();

    const prisma = {
      searchHistory: {
        create: createMock,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchHistoryRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(SearchHistoryRepository);
  });

  describe('create', () => {
    it('creates a search_history row with the requesting userId', async () => {
      createMock.mockResolvedValue({});

      const result = await repository.create({
        userId: 5n,
        query: 'beach house',
      });

      expect(createMock).toHaveBeenCalledWith({
        data: {
          searchId: 'generated-search-id',
          userId: 5n,
          query: 'beach house',
        },
      });
      expect(result).toEqual({ searchId: 'generated-search-id' });
    });

    it('creates a search_history row with a null userId for guest searches', async () => {
      createMock.mockResolvedValue({});

      const result = await repository.create({
        userId: null,
        query: 'beach house',
      });

      expect(createMock).toHaveBeenCalledWith({
        data: {
          searchId: 'generated-search-id',
          userId: null,
          query: 'beach house',
        },
      });
      expect(result).toEqual({ searchId: 'generated-search-id' });
    });
  });
});
