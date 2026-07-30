import { Injectable, Logger } from '@nestjs/common';
import { ulid } from 'ulid';
import {
  TypesenseSearchClient,
  TypesenseSearchFilters,
  TypesenseSearchResult,
} from './typesense/typesense-search.client.js';
import { SearchHistoryRepository } from './search-history.repository.js';
import { SearchResponseDto } from './dto/search-response.dto.js';
import { PaginationMetaDto } from '../common/pagination/pagination-meta.dto.js';

@Injectable()
export class SearchQueryService {
  private readonly logger = new Logger(SearchQueryService.name);

  constructor(
    private readonly typesenseSearchClient: TypesenseSearchClient,
    private readonly searchHistoryRepository: SearchHistoryRepository,
  ) {}

  async search({
    query,
    filters,
    page,
    limit,
    userId,
  }: {
    query: string;
    filters: TypesenseSearchFilters;
    page: number;
    limit: number;
    userId: bigint | null;
  }): Promise<SearchResponseDto> {
    const searchId = ulid();

    const [searchResult, historyResult] = await Promise.allSettled([
      this.typesenseSearchClient.search({ q: query, filters, page, limit }),
      this.searchHistoryRepository.create({ userId, query }),
    ]);

    if (historyResult.status === 'rejected') {
      this.logger.error(
        'Failed to write search_history row',
        historyResult.reason,
      );
    }

    if (searchResult.status === 'rejected') {
      throw searchResult.reason;
    }

    return this.toResponseDto(searchId, searchResult.value, limit);
  }

  private toResponseDto(
    searchId: string,
    result: TypesenseSearchResult,
    limit: number,
  ): SearchResponseDto {
    const dto = new SearchResponseDto();
    dto.searchId = searchId;
    dto.items = result.items;
    dto.facets = result.facets;
    dto.meta = this.toMeta(result, limit);
    return dto;
  }

  private toMeta(
    { found, page }: TypesenseSearchResult,
    limit: number,
  ): PaginationMetaDto {
    const pageCount = Math.max(1, Math.ceil(found / limit));

    const meta = new PaginationMetaDto();
    meta.currentPage = page;
    meta.isFirstPage = page <= 1;
    meta.isLastPage = page >= pageCount;
    meta.previousPage = page > 1 ? page - 1 : null;
    meta.nextPage = page < pageCount ? page + 1 : null;
    meta.pageCount = pageCount;
    meta.totalCount = found;
    return meta;
  }
}
