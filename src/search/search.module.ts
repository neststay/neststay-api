import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SEARCH_QUEUE } from './search.constants';
import { TypesenseClientProvider } from './typesense/typesense-client.provider.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SEARCH_QUEUE,
    }),
  ],
  providers: [TypesenseClientProvider],
})
export class SearchModule {}
