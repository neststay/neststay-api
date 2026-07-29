import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SEARCH_QUEUE } from './search.constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SEARCH_QUEUE,
    }),
  ],
})
export class SearchModule {}
