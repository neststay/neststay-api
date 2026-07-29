import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PROPERTY_CREATED_EVENT } from '../../property/property.constants.js';
import { SearchProducerService } from '../search-producer.service.js';

@Injectable()
export class PropertyCreatedListener {
  private readonly logger = new Logger(PropertyCreatedListener.name);

  constructor(private readonly searchProducer: SearchProducerService) {}

  @OnEvent(PROPERTY_CREATED_EVENT, { async: true })
  async handlePropertyCreated(payload: { slug: string }): Promise<void> {
    try {
      await this.searchProducer.enqueuePropertyIndex({
        payload: { slug: payload.slug },
      });
    } catch (error) {
      this.logger.error('Failed to enqueue property index job', error);
    }
  }
}
