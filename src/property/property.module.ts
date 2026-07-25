import { Module } from '@nestjs/common';
import { PropertyController } from './property.controller.js';
import { PropertyRepository } from './property.repository.js';
import { PropertyService } from './property.service.js';
import { ImageController } from './image/image.controller.js';
import { ImageRepository } from './image/image.repository.js';
import { ImageService } from './image/image.service.js';

@Module({
  controllers: [PropertyController, ImageController],
  providers: [
    PropertyRepository,
    PropertyService,
    ImageRepository,
    ImageService,
  ],
  exports: [PropertyService],
})
export class PropertyModule {}
