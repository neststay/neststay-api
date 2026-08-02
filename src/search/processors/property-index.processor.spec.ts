import { Job } from 'bullmq';
import { PropertyIndexProcessor } from './property-index.processor.js';
import { PropertyService } from '../../property/property.service.js';
import { PropertyWithRelations } from '../../property/property.repository.js';
import { TypesenseClientProvider } from '../typesense/typesense-client.provider.js';
import { PropertyIndexJobPayload } from '../search.types.js';

function buildProperty(
  overrides: Partial<PropertyWithRelations> = {},
): PropertyWithRelations {
  return {
    id: 1n,
    slug: 'a-property',
    hostId: 1n,
    locationId: 2n,
    placeTypeId: 3n,
    nightlyRate: 99.99 as unknown as PropertyWithRelations['nightlyRate'],
    name: 'A property',
    description: 'A property description',
    numberOfGuests: 2,
    numberOfBedrooms: 1,
    numberOfBathrooms: 1,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    images: [
      { id: 2n, propertyId: 1n, url: 'https://example.com/1.jpg', order: 1 },
      { id: 1n, propertyId: 1n, url: 'https://example.com/2.jpg', order: 2 },
    ] as PropertyWithRelations['images'],
    location: { id: 2n, name: 'Lisbon' } as PropertyWithRelations['location'],
    placeType: {
      id: 3n,
      name: 'Apartment',
    } as PropertyWithRelations['placeType'],
    ...overrides,
  };
}

describe('PropertyIndexProcessor', () => {
  let processor: PropertyIndexProcessor;
  let propertyService: { getEntityBySlug: jest.Mock };
  let upsert: jest.Mock;
  let typesenseClientProvider: { getClient: jest.Mock };

  beforeEach(() => {
    propertyService = {
      getEntityBySlug: jest.fn(),
    };
    upsert = jest.fn();
    typesenseClientProvider = {
      getClient: jest.fn().mockReturnValue({
        collections: jest.fn().mockReturnValue({
          documents: jest.fn().mockReturnValue({ upsert }),
        }),
      }),
    };
    processor = new PropertyIndexProcessor(
      propertyService as unknown as PropertyService,
      typesenseClientProvider as unknown as TypesenseClientProvider,
    );
  });

  function buildJob(slug: string): Job<PropertyIndexJobPayload> {
    return { data: { slug } } as Job<PropertyIndexJobPayload>;
  }

  describe('process', () => {
    it('maps the property to a Typesense document and upserts it', async () => {
      const property = buildProperty();
      propertyService.getEntityBySlug.mockResolvedValue(property);

      await processor.process(buildJob('a-property'));

      expect(propertyService.getEntityBySlug).toHaveBeenCalledWith(
        'a-property',
      );
      expect(upsert).toHaveBeenCalledWith({
        id: '1',
        slug: 'a-property',
        name: 'A property',
        description: 'A property description',
        nightlyRate: 99.99,
        numberOfGuests: 2,
        numberOfBedrooms: 1,
        numberOfBathrooms: 1,
        locationId: 2,
        locationName: 'Lisbon',
        placeTypeId: 3,
        placeTypeName: 'Apartment',
        imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
        createdAt: Math.floor(
          new Date('2026-01-01T00:00:00.000Z').getTime() / 1000,
        ),
      });
    });

    it('completes without upserting when the property no longer exists', async () => {
      propertyService.getEntityBySlug.mockResolvedValue(null);

      await expect(
        processor.process(buildJob('missing-property')),
      ).resolves.toBeUndefined();

      expect(upsert).not.toHaveBeenCalled();
    });
  });
});
