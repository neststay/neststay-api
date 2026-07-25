import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { Queue } from 'bullmq';
import helmet from 'helmet';
import cors from 'cors';
import { AppModule } from './app.module';
import { AppConfig } from './config/index.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get<ConfigService<AppConfig, true>>(ConfigService);

  const appConfig = configService.getOrThrow('app');
  const isProduction = appConfig.env === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? undefined
        : {
            directives: {
              ...helmet.contentSecurityPolicy.getDefaultDirectives(),
              'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              'style-src': ["'self'", "'unsafe-inline'"],
            },
          },
    }),
  );

  const corsConfig = configService.getOrThrow('cors');
  app.use(cors({ origin: corsConfig.origins, credentials: false }));

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Neststay API')
      .setDescription('API documentation for Neststay')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token from POST /users/login',
        },
        'bearer',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const queueConfig = configService.getOrThrow('queue');

  if (!isProduction || queueConfig.enableBullBoard) {
    const bullMQAdapter = new ExpressAdapter().setBasePath('/admin/queues');
    const userEventsQueue = app.get('BullQueue_user-events');

    if (userEventsQueue) {
      createBullBoard({
        queues: [new BullMQAdapter(userEventsQueue)],
        serverAdapter: bullMQAdapter,
      });

      app.use('/admin/queues', bullMQAdapter.getRouter());
    }
  }

  await app.listen(appConfig.port);
}
bootstrap();
