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
        where: { locationId: 1 },
        orderBy: { id: 'desc' },
        include: { images: { orderBy: { order: 'asc' } } },
      });
      expect(withPagesMock).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toBe(expectedResult);
    });
  });
});
