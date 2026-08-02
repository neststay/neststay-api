import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service.js';
import { FavouriteRepository } from './favourite.repository.js';

describe('FavouriteRepository', () => {
  let repository: FavouriteRepository;
  let findFirstMock: jest.Mock;
  let createMock: jest.Mock;
  let deleteMock: jest.Mock;
  let paginateMock: jest.Mock;
  let withPagesMock: jest.Mock;

  beforeEach(async () => {
    findFirstMock = jest.fn();
    createMock = jest.fn();
    deleteMock = jest.fn();
    withPagesMock = jest.fn();
    paginateMock = jest.fn().mockReturnValue({ withPages: withPagesMock });

    const prisma = {
      favouriteProperty: {
        findFirst: findFirstMock,
        create: createMock,
        delete: deleteMock,
      },
      extendedClient: {
        favouriteProperty: {
          paginate: paginateMock,
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavouriteRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(FavouriteRepository);
  });

  describe('findByUserAndProperty', () => {
    it('finds a favourite scoped to the user and property', async () => {
      const expectedFavourite = { id: 1n, userId: 1n, propertyId: 1n };
      findFirstMock.mockResolvedValue(expectedFavourite);

      const result = await repository.findByUserAndProperty(1n, 1n);

      expect(findFirstMock).toHaveBeenCalledWith({
        where: { userId: 1n, propertyId: 1n },
      });
      expect(result).toBe(expectedFavourite);
    });
  });

  describe('create', () => {
    it('creates a favourite with the given userId and propertyId', async () => {
      const expectedFavourite = { id: 1n, userId: 1n, propertyId: 1n };
      createMock.mockResolvedValue(expectedFavourite);

      const result = await repository.create(1n, 1n);

      expect(createMock).toHaveBeenCalledWith({
        data: { userId: 1n, propertyId: 1n },
      });
      expect(result).toBe(expectedFavourite);
    });
  });

  describe('delete', () => {
    it('deletes a favourite by id', async () => {
      await repository.delete(1n);

      expect(deleteMock).toHaveBeenCalledWith({ where: { id: 1n } });
    });
  });

  describe('findPaginatedByUser', () => {
    it('paginates favourites for the given user ordered by most recently favourited', async () => {
      const expectedResult = [
        [{ id: 1n, userId: 1n, propertyId: 1n, property: {} }],
        {
          currentPage: 1,
          isLastPage: true,
          previousPage: null,
          nextPage: null,
          pageCount: 1,
          totalCount: 1,
        },
      ];
      withPagesMock.mockResolvedValue(expectedResult);

      const result = await repository.findPaginatedByUser({
        userId: 1n,
        page: 1,
        limit: 10,
      });

      expect(paginateMock).toHaveBeenCalledWith({
        where: { userId: 1n, property: { isActive: true } },
        orderBy: { createdAt: 'desc' },
        include: {
          property: { include: { images: { orderBy: { order: 'asc' } } } },
        },
      });
      expect(withPagesMock).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toBe(expectedResult);
    });

    it('returns an empty result set when the user has no favourites', async () => {
      const expectedResult = [
        [],
        {
          currentPage: 1,
          isLastPage: true,
          previousPage: null,
          nextPage: null,
          pageCount: 1,
          totalCount: 0,
        },
      ];
      withPagesMock.mockResolvedValue(expectedResult);

      const result = await repository.findPaginatedByUser({
        userId: 1n,
        page: 1,
        limit: 10,
      });

      expect(result).toBe(expectedResult);
    });
  });
});
