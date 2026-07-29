import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SEARCH_QUEUE, JOB_PROPERTY_INDEX } from './search.constants';
import { PropertyIndexJobPayload } from './search.types';

@Injectable()
export class SearchProducerService {
  private readonly logger = new Logger(SearchProducerService.name);

  constructor(@InjectQueue(SEARCH_QUEUE) private searchQueue: Queue) {}

  async enqueuePropertyIndex({
    payload,
  }: {
    payload: PropertyIndexJobPayload;
  }): Promise<void> {
    try {
      await this.searchQueue.add(JOB_PROPERTY_INDEX, payload, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          age: 3600,
        },
        removeOnFail: false,
      });
    } catch (error) {
      this.logger.error('Failed to enqueue property index job', error);
      throw error;
    }
  }
}
