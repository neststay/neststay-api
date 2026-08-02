import { TypesenseSearchClient } from './typesense-search.client.js';
import { TypesenseClientProvider } from './typesense-client.provider.js';

describe('TypesenseSearchClient', () => {
  let client: TypesenseSearchClient;
  let searchMock: jest.Mock;
  let typesenseClientProvider: { getClient: jest.Mock };

  beforeEach(() => {
    searchMock = jest.fn().mockResolvedValue({
      hits: [],
      facet_counts: [],
      found: 0,
      page: 1,
    });
    typesenseClientProvider = {
      getClient: jest.fn().mockReturnValue({
        collections: jest.fn().mockReturnValue({
          documents: jest.fn().mockReturnValue({ search: searchMock }),
        }),
      }),
    };
    client = new TypesenseSearchClient(
      typesenseClientProvider as unknown as TypesenseClientProvider,
    );
  });

  describe('search', () => {
    it('always includes isActive:=true in filter_by when no caller filters are supplied', async () => {
      await client.search({ q: 'beach', filters: {}, page: 1, limit: 10 });

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({ filter_by: 'isActive:=true' }),
      );
    });

    it('always includes isActive:=true in filter_by alongside caller-supplied filters', async () => {
      await client.search({
        q: 'beach',
        filters: {
          locationName: 'Lisbon',
          numberOfGuests: 4,
          minNightlyRate: 50,
        },
        page: 1,
        limit: 10,
      });

      const filterBy = searchMock.mock.calls[0][0].filter_by as string;
      expect(filterBy).toContain('isActive:=true');
      expect(filterBy).toContain('locationName:=`Lisbon`');
      expect(filterBy).toContain('numberOfGuests:=4');
      expect(filterBy).toContain('nightlyRate:>=50');
    });

    it('does not allow a caller-supplied isActive filter to override the enforced clause', async () => {
      await client.search({
        q: 'beach',
        filters: {
          isActive: false,
        } as unknown as Parameters<
          TypesenseSearchClient['search']
        >[0]['filters'],
        page: 1,
        limit: 10,
      });

      const filterBy = searchMock.mock.calls[0][0].filter_by as string;
      expect(filterBy).toBe('isActive:=true');
    });
  });
});
