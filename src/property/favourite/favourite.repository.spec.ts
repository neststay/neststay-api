import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service.js';
import { FavouriteRepository } from './favourite.repository.js';

describe('FavouriteRepository', () => {
  let repository: FavouriteRepository;
  let findFirstMock: jest.Mock;
  let createMock: jest.Mock;
  let deleteMock: jest.Mock;

  beforeEach(async () => {
    findFirstMock = jest.fn();
    createMock = jest.fn();
    deleteMock = jest.fn();

    const prisma = {
      favouriteProperty: {
        findFirst: findFirstMock,
        create: createMock,
        delete: deleteMock,
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
});
