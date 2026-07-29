import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { queryLogStore } from './query-log.store.js';

@Injectable()
export class QueryLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('QueryLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return queryLogStore.run([], () => {
      const store = queryLogStore.getStore()!;

      return next.handle().pipe(
        tap(() => {
          const response = context.switchToHttp().getResponse<{
            setHeader: (name: string, value: string) => void;
          }>();
          response.setHeader('X-Query-Count', String(store.length));

          const totalDuration = store.reduce(
            (sum, entry) => sum + entry.duration,
            0,
          );

          this.logger.log(
            `${store.length} quer${store.length === 1 ? 'y' : 'ies'} in ${totalDuration}ms: ${JSON.stringify(
              store.map((entry) => entry.query),
            )}`,
          );
        }),
      );
    });
  }
}
