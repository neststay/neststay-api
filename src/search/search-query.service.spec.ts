import { TypesenseSearchClient } from './typesense/typesense-search.client.js';
import { SearchHistoryRepository } from './search-history.repository.js';
import { SearchQueryService } from './search-query.service.js';

jest.mock('ulid', () => ({
  ulid: jest.fn(() => 'generated-search-id'),
}));

describe('SearchQueryService', () => {
  let service: SearchQueryService;
  let typesenseSearchClient: { search: jest.Mock };
  let searchHistoryRepository: { create: jest.Mock };

  beforeEach(() => {
    typesenseSearchClient = {
      search: jest.fn(),
    };
    searchHistoryRepository = {
      create: jest.fn(),
    };
    service = new SearchQueryService(
      typesenseSearchClient as unknown as TypesenseSearchClient,
      searchHistoryRepository as unknown as SearchHistoryRepository,
    );
  });

  describe('search', () => {
    const params = {
      query: 'beach house',
      filters: {},
      page: 1,
      limit: 10,
      userId: 5n,
    };

    it('returns results, facets, and searchId on a successful search', async () => {
      typesenseSearchClient.search.mockResolvedValue({
        items: [{ slug: 'a-property' }],
        facets: { locationName: [] },
        found: 1,
        page: 1,
      });
      searchHistoryRepository.create.mockResolvedValue({
        searchId: 'generated-search-id',
      });

      const result = await service.search(params);

      expect(typesenseSearchClient.search).toHaveBeenCalledWith({
        q: params.query,
        filters: params.filters,
        page: params.page,
        limit: params.limit,
      });
      expect(searchHistoryRepository.create).toHaveBeenCalledWith({
        searchId: 'generated-search-id',
        userId: params.userId,
        query: params.query,
      });
      expect(result.searchId).toBe('generated-search-id');
      expect(result.items).toEqual([{ slug: 'a-property' }]);
      expect(result.facets).toEqual({ locationName: [] });
      expect(result.meta).toEqual({
        currentPage: 1,
        isFirstPage: true,
        isLastPage: true,
        previousPage: null,
        nextPage: null,
        pageCount: 1,
        totalCount: 1,
      });
    });

    it('propagates the error when the Typesense query fails', async () => {
      const error = new Error('typesense unavailable');
      typesenseSearchClient.search.mockRejectedValue(error);
      searchHistoryRepository.create.mockResolvedValue({
        searchId: 'generated-search-id',
      });

      await expect(service.search(params)).rejects.toThrow(error);
    });

    it('swallows a search_history write failure and falls back to the generated searchId', async () => {
      typesenseSearchClient.search.mockResolvedValue({
        items: [],
        facets: { locationName: [] },
        found: 0,
        page: 1,
      });
      searchHistoryRepository.create.mockRejectedValue(
        new Error('db unavailable'),
      );

      const result = await service.search(params);

      expect(result.searchId).toBe('generated-search-id');
      expect(result.items).toEqual([]);
    });

    it('returns the searchId from the search_history write, not just the generated one', async () => {
      typesenseSearchClient.search.mockResolvedValue({
        items: [],
        facets: { locationName: [] },
        found: 0,
        page: 1,
      });
      searchHistoryRepository.create.mockResolvedValue({
        searchId: 'repository-returned-id',
      });

      const result = await service.search(params);

      expect(searchHistoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ searchId: 'generated-search-id' }),
      );
      expect(result.searchId).toBe('repository-returned-id');
    });
  });
});
