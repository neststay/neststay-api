import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Errors } from 'typesense';
import { AppConfig } from '../../config/index.js';
import {
  PROPERTIES_COLLECTION_NAME,
  propertiesCollectionSchema,
} from './property-collection.schema.js';

@Injectable()
export class TypesenseClientProvider implements OnModuleInit {
  private readonly logger = new Logger(TypesenseClientProvider.name);
  private readonly client: Client;

  constructor(configService: ConfigService<AppConfig, true>) {
    const typesenseConfig = configService.getOrThrow('typesense');

    this.client = new Client({
      nodes: [
        {
          host: typesenseConfig.host,
          port: typesenseConfig.port,
          protocol: typesenseConfig.protocol,
        },
      ],
      apiKey: typesenseConfig.apiKey,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.collections().create(propertiesCollectionSchema);
      this.logger.log(
        `Created Typesense collection "${PROPERTIES_COLLECTION_NAME}"`,
      );
    } catch (error) {
      if (error instanceof Errors.ObjectAlreadyExists) {
        return;
      }
      this.logger.error(
        `Failed to create Typesense collection "${PROPERTIES_COLLECTION_NAME}"`,
        error,
      );
    }
  }

  getClient(): Client {
    return this.client;
  }
}
