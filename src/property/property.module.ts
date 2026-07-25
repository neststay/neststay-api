import { Module } from '@nestjs/common';
import { PropertyController } from './property.controller.js';
import { PropertyRepository } from './property.repository.js';
import { PropertyService } from './property.service.js';
import { ImageController } from './image/image.controller.js';
import { ImageRepository } from './image/image.repository.js';
import { ImageService } from './image/image.service.js';
import { FavouriteController } from './favourite/favourite.controller.js';
import { FavouriteRepository } from './favourite/favourite.repository.js';
import { FavouriteService } from './favourite/favourite.service.js';

@Module({
  controllers: [PropertyController, ImageController, FavouriteController],
  providers: [
    PropertyRepository,
    PropertyService,
    ImageRepository,
    ImageService,
    FavouriteRepository,
    FavouriteService,
  ],
  exports: [PropertyService],
})
export class PropertyModule {}
