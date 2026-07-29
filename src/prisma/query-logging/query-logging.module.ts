import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/index.js';
import { QueryLogInterceptor } from './query-log.interceptor.js';
import { PassthroughQueryLogInterceptor } from './passthrough-query-log.interceptor.js';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const appConfig = configService.getOrThrow('app');

        return appConfig.debug
          ? new QueryLogInterceptor()
          : new PassthroughQueryLogInterceptor();
      },
    },
  ],
})
export class QueryLoggingModule {}
