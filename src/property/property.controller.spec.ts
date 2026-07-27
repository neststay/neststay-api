import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PropertyController } from './property.controller.js';
import { PropertyService } from './property.service.js';
import { FavouriteService } from './favourite/favourite.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PropertyResponseDto } from './dto/property-response.dto.js';
import { PaginatedResponseDto } from '../common/pagination/paginated-response.dto.js';
import { PaginationMetaDto } from '../common/pagination/pagination-meta.dto.js';

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

class DenyGuard implements CanActivate {
  canActivate(): boolean {
    throw new UnauthorizedException();
  }
}

function property(slug: string): PropertyResponseDto {
  return {
    slug,
    name: `Property ${slug}`,
    description: 'A property',
    nightlyRate: '99.99',
    numberOfGuests: 2,
    numberOfBedrooms: 1,
    numberOfBathrooms: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [],
  };
}

function paginatedMeta(overrides: Partial<PaginationMetaDto> = {}) {
  return {
    currentPage: 1,
    isFirstPage: true,
    isLastPage: true,
    previousPage: null,
    nextPage: null,
    pageCount: 1,
    totalCount: 1,
    ...overrides,
  };
}

interface FavouritesEnvelope {
  success: boolean;
  message: string;
  data: PaginatedResponseDto<PropertyResponseDto>;
}

describe('PropertyController - GET /properties/favourites', () => {
  let app: INestApplication<App>;
  let propertyService: { getBySlug: jest.Mock };
  let favouriteService: { listForUser: jest.Mock };

  async function createTestApp(guard: CanActivate): Promise<void> {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PropertyController],
      providers: [
        { provide: PropertyService, useValue: propertyService },
        { provide: FavouriteService, useValue: favouriteService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(guard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }

  beforeEach(() => {
    propertyService = { getBySlug: jest.fn() };
    favouriteService = { listForUser: jest.fn() };
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns favourited properties ordered as provided by the service', async () => {
    const paginated: PaginatedResponseDto<PropertyResponseDto> = {
      items: [property('most-recent'), property('older')],
      meta: paginatedMeta({ totalCount: 2 }),
    };
    favouriteService.listForUser.mockResolvedValue(paginated);
    await createTestApp(new AllowGuard(1n));

    const response = await request(app.getHttpServer())
      .get('/properties/favourites')
      .expect(200);

    const body = response.body as FavouritesEnvelope;
    expect(body.data.items.map((item) => item.slug)).toEqual([
      'most-recent',
      'older',
    ]);
    expect(favouriteService.listForUser).toHaveBeenCalledWith({
      userId: 1n,
      page: 1,
      limit: 10,
    });
  });

  it('returns an empty list for a user with no favourites', async () => {
    favouriteService.listForUser.mockResolvedValue({
      items: [],
      meta: paginatedMeta({ totalCount: 0 }),
    });
    await createTestApp(new AllowGuard(1n));

    const response = await request(app.getHttpServer())
      .get('/properties/favourites')
      .expect(200);

    const body = response.body as FavouritesEnvelope;
    expect(body.data.items).toEqual([]);
    expect(body.data.meta.totalCount).toBe(0);
  });

  it('passes page and limit query params through to the service', async () => {
    favouriteService.listForUser.mockResolvedValue({
      items: [],
      meta: paginatedMeta({ currentPage: 2, totalCount: 0 }),
    });
    await createTestApp(new AllowGuard(1n));

    await request(app.getHttpServer())
      .get('/properties/favourites?page=2&limit=5')
      .expect(200);

    expect(favouriteService.listForUser).toHaveBeenCalledWith({
      userId: 1n,
      page: 2,
      limit: 5,
    });
  });

  it('scopes the request to the authenticated user from the JWT', async () => {
    favouriteService.listForUser.mockResolvedValue({
      items: [],
      meta: paginatedMeta({ totalCount: 0 }),
    });
    await createTestApp(new AllowGuard(42n));

    await request(app.getHttpServer())
      .get('/properties/favourites')
      .expect(200);

    expect(favouriteService.listForUser).toHaveBeenCalledWith({
      userId: 42n,
      page: 1,
      limit: 10,
    });
  });

  it('responds 401 for an unauthenticated request', async () => {
    await createTestApp(new DenyGuard());

    await request(app.getHttpServer())
      .get('/properties/favourites')
      .expect(401);

    expect(favouriteService.listForUser).not.toHaveBeenCalled();
  });

  it('routes to the favourites handler instead of findBySlug(":slug")', async () => {
    favouriteService.listForUser.mockResolvedValue({
      items: [],
      meta: paginatedMeta({ totalCount: 0 }),
    });
    await createTestApp(new AllowGuard(1n));

    await request(app.getHttpServer())
      .get('/properties/favourites')
      .expect(200);

    expect(favouriteService.listForUser).toHaveBeenCalledTimes(1);
    expect(propertyService.getBySlug).not.toHaveBeenCalled();
  });
});
