import type { ConfigType } from '@nestjs/config';
import appConfig from './app.config.js';
import corsConfig from './cors.config.js';
import databaseConfig from './database.config.js';
import jwtConfig from './jwt.config.js';
import redisConfig from './redis.config.js';
import queueConfig from './queue.config.js';
import typesenseConfig from './typesense.config.js';

export {
  appConfig,
  corsConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  queueConfig,
  typesenseConfig,
};
export { validateEnv, validationSchema } from './validation.schema.js';
export type { EnvConfig } from './validation.schema.js';

export interface AppConfig {
  app: ConfigType<typeof appConfig>;
  cors: ConfigType<typeof corsConfig>;
  database: ConfigType<typeof databaseConfig>;
  jwt: ConfigType<typeof jwtConfig>;
  redis: ConfigType<typeof redisConfig>;
  queue: ConfigType<typeof queueConfig>;
  typesense: ConfigType<typeof typesenseConfig>;
}
