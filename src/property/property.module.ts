import { Module } from '@nestjs/common';
import { PropertyController } from './property.controller.js';
import { PropertyRepository } from './property.repository.js';
import { PropertyService } from './property.service.js';

@Module({
  controllers: [PropertyController],
  providers: [PropertyRepository, PropertyService],
  exports: [PropertyService],
})
export class PropertyModule {}
