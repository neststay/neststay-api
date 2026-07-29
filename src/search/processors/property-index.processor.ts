import { Logger } from '@nestjs/common';
import { WorkerHost, Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SEARCH_QUEUE } from '../search.constants.js';
import { PropertyIndexJobPayload, PropertyDocument } from '../search.types.js';
import { TypesenseClientProvider } from '../typesense/typesense-client.provider.js';
import { PROPERTIES_COLLECTION_NAME } from '../typesense/property-collection.schema.js';
import { PropertyService } from '../../property/property.service.js';
import { PropertyWithRelations } from '../../property/property.repository.js';

@Processor(SEARCH_QUEUE)
export class PropertyIndexProcessor extends WorkerHost {
  private readonly logger = new Logger(PropertyIndexProcessor.name);

  constructor(
    private readonly propertyService: PropertyService,
    private readonly typesenseClientProvider: TypesenseClientProvider,
  ) {
    super();
  }

  async process(job: Job<PropertyIndexJobPayload>): Promise<void> {
    const property = await this.propertyService.getEntityBySlug(job.data.slug);
    if (!property) {
      this.logger.warn(
        `Property ${job.data.slug} not found, skipping indexing`,
      );
      return;
    }

    const document = this.toDocument(property);

    await this.typesenseClientProvider
      .getClient()
      .collections<PropertyDocument>(PROPERTIES_COLLECTION_NAME)
      .documents()
      .upsert(document);
  }

  private toDocument(property: PropertyWithRelations): PropertyDocument {
    return {
      id: property.id.toString(),
      slug: property.slug,
      name: property.name,
      description: property.description,
      nightlyRate: Number(property.nightlyRate),
      numberOfGuests: property.numberOfGuests,
      numberOfBedrooms: property.numberOfBedrooms,
      numberOfBathrooms: property.numberOfBathrooms,
      locationId: Number(property.locationId),
      locationName: property.location.name,
      placeTypeId: Number(property.placeTypeId),
      placeTypeName: property.placeType.name,
      imageUrls: property.images.map((image) => image.url),
      createdAt: Math.floor(property.createdAt.getTime() / 1000),
    };
  }
}
