import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { AppConfig } from '../config/index.js';
import { PrismaService } from './prisma.service.js';
import { queryLogStore } from './query-logging/query-log.store.js';

function buildConfig(debug: boolean): ConfigService<AppConfig, true> {
  return {
    getOrThrow: (key: string) => {
      if (key === 'database') {
        return { url: 'postgres://fake:fake@localhost:5432/fake' };
      }
      if (key === 'app') {
        return { debug, env: 'test', port: 3000 };
      }
      throw new Error(`unexpected config key: ${key}`);
    },
  } as unknown as ConfigService<AppConfig, true>;
}

describe('PrismaService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers a query event listener when APP_DEBUG is true', () => {
    const onSpy = jest.spyOn(PrismaClient.prototype, '$on');

    new PrismaService(buildConfig(true));

    expect(onSpy).toHaveBeenCalledWith('query', expect.any(Function));
  });

  it('pushes emitted queries onto the active query-log store', () => {
    const onSpy = jest.spyOn(PrismaClient.prototype, '$on');

    new PrismaService(buildConfig(true));

    const handler = onSpy.mock.calls[0][1] as (event: {
      query: string;
      params: string;
      duration: number;
    }) => void;

    queryLogStore.run([], () => {
      handler({ query: 'select 1', params: '[]', duration: 5 });

      expect(queryLogStore.getStore()).toEqual([
        { query: 'select 1', params: '[]', duration: 5 },
      ]);
    });
  });

  it('does not register a query event listener when APP_DEBUG is false', () => {
    const onSpy = jest.spyOn(PrismaClient.prototype, '$on');

    new PrismaService(buildConfig(false));

    expect(onSpy).not.toHaveBeenCalled();
  });
});
