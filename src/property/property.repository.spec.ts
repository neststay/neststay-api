import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { PropertyRepository } from './property.repository.js';

describe('PropertyRepository', () => {
  let repository: PropertyRepository;
  let paginateMock: jest.Mock;
  let withPagesMock: jest.Mock;

  beforeEach(async () => {
    withPagesMock = jest.fn();
    paginateMock = jest.fn().mockReturnValue({ withPages: withPagesMock });

    const prisma = {
      extendedClient: {
        property: {
          paginate: paginateMock,
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(PropertyRepository);
  });

  describe('findAllPaginatedByLocation', () => {
    it('orders properties by id desc by default', async () => {
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

      const result = await repository.findAllPaginatedByLocation({
        locationId: 1,
        page: 1,
        limit: 10,
      });

      expect(paginateMock).toHaveBeenCalledWith({
        where: { locationId: 1, isActive: true },
        orderBy: { id: 'desc' },
        include: { images: { orderBy: { order: 'asc' } } },
      });
      expect(withPagesMock).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toBe(expectedResult);
    });

    it('filters to active properties only', async () => {
      withPagesMock.mockResolvedValue([
        [],
        {
          currentPage: 1,
          isLastPage: true,
          previousPage: null,
          nextPage: null,
          pageCount: 1,
          totalCount: 0,
        },
      ]);

      await repository.findAllPaginatedByLocation({
        locationId: 1,
        page: 1,
        limit: 10,
      });

      expect(paginateMock).toHaveBeenCalledWith(
        expect.objectContaining({ where: { locationId: 1, isActive: true } }),
      );
    });

    it('includes favouriteProperties filtered by userId when userId is provided', async () => {
      withPagesMock.mockResolvedValue([
        [],
        {
          currentPage: 1,
          isLastPage: true,
          previousPage: null,
          nextPage: null,
          pageCount: 1,
          totalCount: 0,
        },
      ]);

      await repository.findAllPaginatedByLocation({
        locationId: 1,
        page: 1,
        limit: 10,
        userId: 5n,
      });

      expect(paginateMock).toHaveBeenCalledWith({
        where: { locationId: 1, isActive: true },
        orderBy: { id: 'desc' },
        include: {
          images: { orderBy: { order: 'asc' } },
          favouriteProperties: { where: { userId: 5n } },
        },
      });
    });

    it('omits the favouriteProperties include when userId is null', async () => {
      withPagesMock.mockResolvedValue([
        [],
        {
          currentPage: 1,
          isLastPage: true,
          previousPage: null,
          nextPage: null,
          pageCount: 1,
          totalCount: 0,
        },
      ]);

      await repository.findAllPaginatedByLocation({
        locationId: 1,
        page: 1,
        limit: 10,
        userId: null,
      });

      expect(paginateMock).toHaveBeenCalledWith({
        where: { locationId: 1, isActive: true },
        orderBy: { id: 'desc' },
        include: { images: { orderBy: { order: 'asc' } } },
      });
    });
  });
});
