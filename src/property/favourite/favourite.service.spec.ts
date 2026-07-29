import { PropertyModel } from '../../../generated/prisma/models/Property.js';
import { PropertyRepository } from '../property.repository.js';
import { PropertyService } from '../property.service.js';
import { FavouriteRepository } from './favourite.repository.js';
import { FavouriteService } from './favourite.service.js';

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

describe('FavouriteService', () => {
  let service: FavouriteService;
  let favouriteRepository: { findPaginatedByUser: jest.Mock };
  let propertyService: PropertyService;

  beforeEach(() => {
    favouriteRepository = { findPaginatedByUser: jest.fn() };
    propertyService = new PropertyService(
      undefined as unknown as PropertyRepository,
    );
    service = new FavouriteService(
      favouriteRepository as unknown as FavouriteRepository,
      propertyService,
    );
  });

  describe('listForUser', () => {
    it('marks every listed property as favourited regardless of the favouriteProperties relation', async () => {
      favouriteRepository.findPaginatedByUser.mockResolvedValue([
        [
          {
            id: 1n,
            userId: 1n,
            propertyId: 1n,
            createdAt: new Date(),
            property: buildProperty(),
          },
        ],
        {
          currentPage: 1,
          isLastPage: true,
          previousPage: null,
          nextPage: null,
          pageCount: 1,
          totalCount: 1,
        },
      ]);

      const result = await service.listForUser({
        userId: 1n,
        page: 1,
        limit: 10,
      });

      expect(result.items[0].isFavourited).toBe(true);
    });
  });
});
