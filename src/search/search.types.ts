export interface PropertyIndexJobPayload {
  slug: string;
}

export interface PropertyDocument {
  id: string;
  slug: string;
  name: string;
  description: string;
  nightlyRate: number;
  numberOfGuests: number;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  locationId: number;
  locationName: string;
  placeTypeId: number;
  placeTypeName: string;
  imageUrls: string[];
  createdAt: number;
}
