import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { SearchController } from './search.controller.js';
import { SearchQueryService } from './search-query.service.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { SearchResponseDto } from './dto/search-response.dto.js';

class AllowGuard implements CanActivate {
  constructor(private readonly userId: bigint) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user: { userId: bigint } }>();
    request.user = { userId: this.userId };
    return true;
  }
}

class AnonymousGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

class DenyGuard implements CanActivate {
  canActivate(): boolean {
    throw new UnauthorizedException();
  }
}

function searchResponse(): SearchResponseDto {
  return {
    searchId: '01JABC1234567890ABCDEFGH',
    items: [],
    facets: {
      locationName: [],
      placeTypeName: [],
      numberOfGuests: [],
      numberOfBedrooms: [],
      numberOfBathrooms: [],
    },
    meta: {
      currentPage: 1,
      isFirstPage: true,
      isLastPage: true,
      previousPage: null,
      nextPage: null,
      pageCount: 1,
      totalCount: 0,
    },
  };
}

interface SearchEnvelope {
  success: boolean;
  message: string;
  data: SearchResponseDto;
}

describe('SearchController - GET /search', () => {
  let app: INestApplication<App>;
  let searchQueryService: { search: jest.Mock };

  async function createTestApp(guard: CanActivate): Promise<void> {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        { provide: SearchQueryService, useValue: searchQueryService },
      ],
    })
      .overrideGuard(OptionalJwtAuthGuard)
      .useValue(guard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }

  beforeEach(() => {
    searchQueryService = { search: jest.fn() };
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns results for a guest search', async () => {
    searchQueryService.search.mockResolvedValue(searchResponse());
    await createTestApp(new AnonymousGuard());

    const response = await request(app.getHttpServer())
      .get('/search?q=beach+house')
      .expect(200);

    const body = response.body as SearchEnvelope;
    expect(body.data.searchId).toBe('01JABC1234567890ABCDEFGH');
    expect(searchQueryService.search).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'beach house', userId: null }),
    );
  });

  it('passes the authenticated userId through to the service', async () => {
    searchQueryService.search.mockResolvedValue(searchResponse());
    await createTestApp(new AllowGuard(7n));

    await request(app.getHttpServer()).get('/search?q=beach+house').expect(200);

    expect(searchQueryService.search).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'beach house', userId: 7n }),
    );
  });

  it('maps facet filter query params through to the service filters', async () => {
    searchQueryService.search.mockResolvedValue(searchResponse());
    await createTestApp(new AnonymousGuard());

    await request(app.getHttpServer())
      .get('/search?q=apartment&locationName=Goa&numberOfGuests=2')
      .expect(200);

    expect(searchQueryService.search).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'apartment',
        filters: expect.objectContaining({
          locationName: 'Goa',
          numberOfGuests: 2,
        }),
      }),
    );
  });

  it('responds 422 when the required q param is missing', async () => {
    await createTestApp(new AnonymousGuard());

    await request(app.getHttpServer()).get('/search').expect(422);

    expect(searchQueryService.search).not.toHaveBeenCalled();
  });

  it('responds 401 when authentication fails', async () => {
    await createTestApp(new DenyGuard());

    await request(app.getHttpServer()).get('/search?q=beach+house').expect(401);

    expect(searchQueryService.search).not.toHaveBeenCalled();
  });
});
