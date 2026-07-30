import { Injectable } from '@nestjs/common';
import type { SearchResponseFacetCountSchema } from 'typesense';
import { TypesenseClientProvider } from './typesense-client.provider.js';
import { PROPERTIES_COLLECTION_NAME } from './property-collection.schema.js';
import { PropertyDocument } from '../search.types.js';
import { SearchResultItemDto } from '../dto/search-result-item.dto.js';
import {
  FacetCountItemDto,
  SearchFacetsDto,
} from '../dto/search-facets.dto.js';

const FACET_FIELDS = [
  'locationName',
  'placeTypeName',
  'numberOfGuests',
  'numberOfBedrooms',
  'numberOfBathrooms',
] as const;

export interface TypesenseSearchFilters {
  locationName?: string;
  placeTypeName?: string;
  minNightlyRate?: number;
  maxNightlyRate?: number;
  numberOfGuests?: number;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
}

export interface TypesenseSearchParams {
  q: string;
  filters: TypesenseSearchFilters;
  page: number;
  limit: number;
}

export interface TypesenseSearchResult {
  items: SearchResultItemDto[];
  facets: SearchFacetsDto;
  found: number;
  page: number;
}

@Injectable()
export class TypesenseSearchClient {
  constructor(
    private readonly typesenseClientProvider: TypesenseClientProvider,
  ) {}

  async search(params: TypesenseSearchParams): Promise<TypesenseSearchResult> {
    const response = await this.typesenseClientProvider
      .getClient()
      .collections<PropertyDocument>(PROPERTIES_COLLECTION_NAME)
      .documents()
      .search({
        q: params.q,
        query_by: 'name,description',
        filter_by: this.buildFilterBy(params.filters),
        facet_by: FACET_FIELDS.join(','),
        page: params.page,
        per_page: params.limit,
      });

    return {
      items: (response.hits ?? []).map((hit) =>
        this.toResultItem(hit.document),
      ),
      facets: this.toFacetsDto(response.facet_counts ?? []),
      found: response.found,
      page: response.page,
    };
  }

  private buildFilterBy(filters: TypesenseSearchFilters): string | undefined {
    const clauses: string[] = [];

    if (filters.locationName !== undefined) {
      clauses.push(`locationName:=\`${filters.locationName}\``);
    }
    if (filters.placeTypeName !== undefined) {
      clauses.push(`placeTypeName:=\`${filters.placeTypeName}\``);
    }
    if (filters.numberOfGuests !== undefined) {
      clauses.push(`numberOfGuests:=${filters.numberOfGuests}`);
    }
    if (filters.numberOfBedrooms !== undefined) {
      clauses.push(`numberOfBedrooms:=${filters.numberOfBedrooms}`);
    }
    if (filters.numberOfBathrooms !== undefined) {
      clauses.push(`numberOfBathrooms:=${filters.numberOfBathrooms}`);
    }
    if (filters.minNightlyRate !== undefined) {
      clauses.push(`nightlyRate:>=${filters.minNightlyRate}`);
    }
    if (filters.maxNightlyRate !== undefined) {
      clauses.push(`nightlyRate:<=${filters.maxNightlyRate}`);
    }

    return clauses.length > 0 ? clauses.join(' && ') : undefined;
  }

  private toResultItem(document: PropertyDocument): SearchResultItemDto {
    const dto = new SearchResultItemDto();
    dto.slug = document.slug;
    dto.name = document.name;
    dto.description = document.description;
    dto.nightlyRate = document.nightlyRate;
    dto.numberOfGuests = document.numberOfGuests;
    dto.numberOfBedrooms = document.numberOfBedrooms;
    dto.numberOfBathrooms = document.numberOfBathrooms;
    dto.locationName = document.locationName;
    dto.placeTypeName = document.placeTypeName;
    dto.imageUrls = document.imageUrls;
    dto.createdAt = document.createdAt;
    return dto;
  }

  private toFacetsDto(
    facetCounts: SearchResponseFacetCountSchema<PropertyDocument>[],
  ): SearchFacetsDto {
    const dto = new SearchFacetsDto();
    dto.locationName = this.extractFacetCounts(facetCounts, 'locationName');
    dto.placeTypeName = this.extractFacetCounts(facetCounts, 'placeTypeName');
    dto.numberOfGuests = this.extractFacetCounts(facetCounts, 'numberOfGuests');
    dto.numberOfBedrooms = this.extractFacetCounts(
      facetCounts,
      'numberOfBedrooms',
    );
    dto.numberOfBathrooms = this.extractFacetCounts(
      facetCounts,
      'numberOfBathrooms',
    );
    return dto;
  }

  private extractFacetCounts(
    facetCounts: SearchResponseFacetCountSchema<PropertyDocument>[],
    fieldName: keyof PropertyDocument,
  ): FacetCountItemDto[] {
    const facet = facetCounts.find((f) => f.field_name === fieldName);
    if (!facet) return [];

    return facet.counts.map((count) => {
      const item = new FacetCountItemDto();
      item.value = count.value;
      item.count = count.count;
      return item;
    });
  }
}
