import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PROPERTY_ACTIVATED_EVENT } from '../../property/property.constants.js';
import { SearchProducerService } from '../search-producer.service.js';

@Injectable()
export class PropertyActivatedListener {
  private readonly logger = new Logger(PropertyActivatedListener.name);

  constructor(private readonly searchProducer: SearchProducerService) {}

  @OnEvent(PROPERTY_ACTIVATED_EVENT, { async: true })
  async handlePropertyActivated(payload: { slug: string }): Promise<void> {
    try {
      await this.searchProducer.enqueuePropertyIndex({
        payload: { slug: payload.slug },
      });
    } catch (error) {
      this.logger.error('Failed to enqueue property index job', error);
    }
  }
}
