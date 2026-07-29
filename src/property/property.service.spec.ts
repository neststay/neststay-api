import { EventEmitter2 } from '@nestjs/event-emitter';
import { PropertyModel } from '../../generated/prisma/models/Property.js';
import { FavouritePropertyModel } from '../../generated/prisma/models/FavouriteProperty.js';
import { PropertyRepository } from './property.repository.js';
import { PropertyService } from './property.service.js';
import { PROPERTY_CREATED_EVENT } from './property.constants.js';

function buildProperty(overrides: Partial<PropertyModel> = {}): PropertyModel {
  return {
    id: 1n,
    slug: 'a-property',
    hostId: 1n,
    locationId: 1n,
    placeTypeId: 1n,
    nightlyRate: 99.99 as unknown as PropertyModel['nightlyRate'],
    name: 'A property',
    description: 'A property description',
    numberOfGuests: 2,
    numberOfBedrooms: 1,
    numberOfBathrooms: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildFavourite(userId: bigint): FavouritePropertyModel {
  return {
    id: 1n,
    userId,
    propertyId: 1n,
    createdAt: new Date(),
  };
}

describe('PropertyService', () => {
  let service: PropertyService;
  let repository: {
    findAllPaginatedByLocation: jest.Mock;
    create: jest.Mock;
  };
  let eventEmitter: {
    emit: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findAllPaginatedByLocation: jest.fn(),
      create: jest.fn(),
    };
    eventEmitter = {
      emit: jest.fn(),
    };
    service = new PropertyService(
      repository as unknown as PropertyRepository,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  describe('create', () => {
    it('emits PROPERTY_CREATED_EVENT with the created property slug', async () => {
      const property = buildProperty({ slug: 'a-new-property' });
      repository.create.mockResolvedValue(property);

      await service.create(
        {} as unknown as Parameters<PropertyService['create']>[0],
        1n,
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(PROPERTY_CREATED_EVENT, {
        slug: 'a-new-property',
      });
    });
  });

  describe('toResponseDto', () => {
    it('sets isFavourited true when the requesting user has favourited the property', () => {
      const dto = service.toResponseDto(
        buildProperty({
          favouriteProperties: [buildFavourite(1n)],
        } as Partial<PropertyModel>),
      );

      expect(dto.isFavourited).toBe(true);
    });

    it('sets isFavourited false when the favourites relation is empty', () => {
      const dto = service.toResponseDto(
        buildProperty({ favouriteProperties: [] } as Partial<PropertyModel>),
      );

      expect(dto.isFavourited).toBe(false);
    });

    it('sets isFavourited false when the favourites relation is absent (anonymous caller)', () => {
      const dto = service.toResponseDto(buildProperty());

      expect(dto.isFavourited).toBe(false);
    });
  });

  describe('listByLocation', () => {
    it('threads the requesting userId through to the repository', async () => {
      repository.findAllPaginatedByLocation.mockResolvedValue([
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

      await service.listByLocation({
        locationId: 1,
        page: 1,
        limit: 10,
        userId: 5n,
      });

      expect(repository.findAllPaginatedByLocation).toHaveBeenCalledWith({
        locationId: 1,
        page: 1,
        limit: 10,
        userId: 5n,
      });
    });

    it('threads a null userId through for an anonymous caller', async () => {
      repository.findAllPaginatedByLocation.mockResolvedValue([
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

      await service.listByLocation({
        locationId: 1,
        page: 1,
        limit: 10,
        userId: null,
      });

      expect(repository.findAllPaginatedByLocation).toHaveBeenCalledWith({
        locationId: 1,
        page: 1,
        limit: 10,
        userId: null,
      });
    });
  });
});
