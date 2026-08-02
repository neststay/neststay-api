import type { CollectionCreateSchema } from 'typesense';

export const PROPERTIES_COLLECTION_NAME = 'properties';

export const propertiesCollectionSchema: CollectionCreateSchema = {
  name: PROPERTIES_COLLECTION_NAME,
  fields: [
    { name: 'id', type: 'string' },
    { name: 'slug', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'nightlyRate', type: 'float', facet: true },
    { name: 'numberOfGuests', type: 'int32', facet: true },
    { name: 'numberOfBedrooms', type: 'int32', facet: true },
    { name: 'numberOfBathrooms', type: 'int32', facet: true },
    { name: 'locationId', type: 'int64', facet: true },
    { name: 'locationName', type: 'string', facet: true },
    { name: 'placeTypeId', type: 'int64', facet: true },
    { name: 'placeTypeName', type: 'string', facet: true },
    { name: 'imageUrls', type: 'string[]', facet: false },
    { name: 'isActive', type: 'bool', facet: true },
    { name: 'createdAt', type: 'int64' },
  ],
  default_sorting_field: 'createdAt',
};
