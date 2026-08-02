import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SEARCH_QUEUE } from './search.constants';
import { TypesenseClientProvider } from './typesense/typesense-client.provider.js';
import { TypesenseSearchClient } from './typesense/typesense-search.client.js';
import { SearchProducerService } from './search-producer.service.js';
import { SearchHistoryRepository } from './search-history.repository.js';
import { SearchQueryService } from './search-query.service.js';
import { SearchController } from './search.controller.js';
import { PropertyCreatedListener } from './listeners/property-created.listener.js';
import { PropertyActivatedListener } from './listeners/property-activated.listener.js';
import { PropertyDeactivatedListener } from './listeners/property-deactivated.listener.js';
import { PropertyIndexProcessor } from './processors/property-index.processor.js';
import { PropertyModule } from '../property/property.module.js';

@Module({
  imports: [
    PropertyModule,
    BullModule.registerQueue({
      name: SEARCH_QUEUE,
    }),
  ],
  controllers: [SearchController],
  providers: [
    TypesenseClientProvider,
    TypesenseSearchClient,
    SearchProducerService,
    SearchHistoryRepository,
    SearchQueryService,
    PropertyCreatedListener,
    PropertyActivatedListener,
    PropertyDeactivatedListener,
    PropertyIndexProcessor,
  ],
})
export class SearchModule {}
