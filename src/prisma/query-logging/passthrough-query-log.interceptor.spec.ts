import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { PassthroughQueryLogInterceptor } from './passthrough-query-log.interceptor.js';

describe('PassthroughQueryLogInterceptor', () => {
  it('passes the response through untouched: no X-Query-Count header and no summary log', (done) => {
    const response = { setHeader: jest.fn() };
    const context = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ExecutionContext;

    const handler: CallHandler = { handle: () => of('result') };
    const interceptor = new PassthroughQueryLogInterceptor();

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toBe('result');
      expect(response.setHeader).not.toHaveBeenCalled();
      done();
    });
  });
});
