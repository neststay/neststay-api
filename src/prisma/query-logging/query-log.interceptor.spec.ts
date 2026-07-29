import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { of } from 'rxjs';
import { QueryLogInterceptor } from './query-log.interceptor.js';
import { queryLogStore } from './query-log.store.js';

function buildContext(): {
  context: ExecutionContext;
  response: { setHeader: jest.Mock };
} {
  const response = { setHeader: jest.fn() };
  const context = {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;

  return { context, response };
}

describe('QueryLogInterceptor', () => {
  let interceptor: QueryLogInterceptor;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new QueryLogInterceptor();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('collects queries pushed into the ALS store during handler execution and reports the count', (done) => {
    const { context, response } = buildContext();

    const handler: CallHandler = {
      handle: () => {
        queryLogStore
          .getStore()!
          .push({ query: 'select 1', params: '[]', duration: 5 });
        queryLogStore
          .getStore()!
          .push({ query: 'select 2', params: '[]', duration: 3 });
        return of('result');
      },
    };

    interceptor.intercept(context, handler).subscribe(() => {
      expect(response.setHeader).toHaveBeenCalledWith('X-Query-Count', '2');
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('2 queries in 8ms'),
      );
      done();
    });
  });

  it('reports a zero query count when no queries are pushed into the store', (done) => {
    const { context, response } = buildContext();

    const handler: CallHandler = {
      handle: () => of('result'),
    };

    interceptor.intercept(context, handler).subscribe(() => {
      expect(response.setHeader).toHaveBeenCalledWith('X-Query-Count', '0');
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('0 queries in 0ms'),
      );
      done();
    });
  });
});
