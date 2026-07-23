import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_USER_EVENTS } from './queue.constants';
import { QueueProducerService } from './queue-producer.service';
import { UserRegisterProcessor } from './processors/user-register.processor';
import { AppConfig } from '../config/index.js';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const queueConfig = configService.getOrThrow('queue');
        return {
          connection: {
            url: queueConfig.url,
          },
          prefix: queueConfig.prefix,
        };
      },
    }),
    BullModule.registerQueue({
      name: QUEUE_USER_EVENTS,
    }),
  ],
  providers: [QueueProducerService, UserRegisterProcessor],
  exports: [QueueProducerService],
})
export class QueueModule {}
