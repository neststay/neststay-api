import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ImageRepository } from './image.repository.js';

describe('ImageRepository', () => {
  let repository: ImageRepository;
  let createMock: jest.Mock;
  let findFirstMock: jest.Mock;
  let findManyMock: jest.Mock;
  let deleteMock: jest.Mock;
  let updateMock: jest.Mock;
  let transactionMock: jest.Mock;

  beforeEach(async () => {
    createMock = jest.fn();
    findFirstMock = jest.fn();
    findManyMock = jest.fn();
    deleteMock = jest.fn();
    updateMock = jest.fn();
    transactionMock = jest.fn();

    const prisma = {
      image: {
        create: createMock,
        findFirst: findFirstMock,
        findMany: findManyMock,
        delete: deleteMock,
        update: updateMock,
      },
      $transaction: transactionMock,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(ImageRepository);
  });

  describe('create', () => {
    it('creates an image with the given propertyId, url and order', async () => {
      const expectedImage = {
        id: 1n,
        propertyId: 1n,
        url: 'https://example.com/a.jpg',
        order: 0,
      };
      createMock.mockResolvedValue(expectedImage);

      const result = await repository.create({
        propertyId: 1n,
        url: 'https://example.com/a.jpg',
        order: 0,
      });

      expect(createMock).toHaveBeenCalledWith({
        data: { propertyId: 1n, url: 'https://example.com/a.jpg', order: 0 },
      });
      expect(result).toBe(expectedImage);
    });
  });

  describe('findAllByPropertyId', () => {
    it('orders images by order asc', async () => {
      const expectedImages = [{ id: 1n, propertyId: 1n, url: 'a', order: 0 }];
      findManyMock.mockResolvedValue(expectedImages);

      const result = await repository.findAllByPropertyId(1n);

      expect(findManyMock).toHaveBeenCalledWith({
        where: { propertyId: 1n },
        orderBy: { order: 'asc' },
      });
      expect(result).toBe(expectedImages);
    });
  });

  describe('findByIdAndPropertyId', () => {
    it('finds an image scoped to its property', async () => {
      const expectedImage = { id: 1n, propertyId: 1n, url: 'a', order: 0 };
      findFirstMock.mockResolvedValue(expectedImage);

      const result = await repository.findByIdAndPropertyId(1n, 1n);

      expect(findFirstMock).toHaveBeenCalledWith({
        where: { id: 1n, propertyId: 1n },
      });
      expect(result).toBe(expectedImage);
    });
  });

  describe('delete', () => {
    it('deletes an image by id', async () => {
      await repository.delete(1n);

      expect(deleteMock).toHaveBeenCalledWith({ where: { id: 1n } });
    });
  });

  describe('updateOrders', () => {
    it('applies order by array position inside a single transaction', async () => {
      const updateOps = [{}, {}];
      updateMock
        .mockReturnValueOnce(updateOps[0])
        .mockReturnValueOnce(updateOps[1]);
      transactionMock.mockResolvedValue(undefined);

      await repository.updateOrders(1n, [3n, 2n]);

      expect(updateMock).toHaveBeenNthCalledWith(1, {
        where: { id: 3n, propertyId: 1n },
        data: { order: 0 },
      });
      expect(updateMock).toHaveBeenNthCalledWith(2, {
        where: { id: 2n, propertyId: 1n },
        data: { order: 1 },
      });
      expect(transactionMock).toHaveBeenCalledWith(updateOps);
    });
  });
});
