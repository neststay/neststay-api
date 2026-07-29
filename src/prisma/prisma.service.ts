import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { pagination } from 'prisma-extension-pagination';
import { PrismaClient } from '../../generated/prisma/client.js';
import { AppConfig } from '../config/index.js';
import { queryLogStore } from './query-logging/query-log.store.js';

const paginationExtension = pagination({
  pages: {
    limit: 10,
    includePageCount: true,
  },
});

function extendWithPagination(client: PrismaClient) {
  return client.$extends(paginationExtension);
}

export type ExtendedPrismaClient = ReturnType<typeof extendWithPagination>;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;
  readonly extendedClient: ExtendedPrismaClient;

  constructor(config: ConfigService<AppConfig, true>) {
    const databaseConfig = config.getOrThrow('database');
    const appConfig = config.getOrThrow('app');
    const pool = new Pool({ connectionString: databaseConfig.url });
    const adapter = new PrismaPg(pool);

    if (appConfig.debug) {
      super({ adapter, log: [{ emit: 'event', level: 'query' }] });
    } else {
      super({ adapter });
    }

    this.pool = pool;
    this.extendedClient = extendWithPagination(this);

    if (appConfig.debug) {
      (this as PrismaClient<'query'>).$on('query', (event) => {
        const store = queryLogStore.getStore();
        if (!store) return;

        store.push({
          query: event.query,
          params: event.params,
          duration: event.duration,
        });
      });
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
