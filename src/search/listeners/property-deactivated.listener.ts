import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PROPERTY_DEACTIVATED_EVENT } from '../../property/property.constants.js';
import { SearchProducerService } from '../search-producer.service.js';

@Injectable()
export class PropertyDeactivatedListener {
  private readonly logger = new Logger(PropertyDeactivatedListener.name);

  constructor(private readonly searchProducer: SearchProducerService) {}

  @OnEvent(PROPERTY_DEACTIVATED_EVENT, { async: true })
  async handlePropertyDeactivated(payload: { slug: string }): Promise<void> {
    try {
      await this.searchProducer.enqueuePropertyIndex({
        payload: { slug: payload.slug },
      });
    } catch (error) {
      this.logger.error('Failed to enqueue property index job', error);
    }
  }
}
