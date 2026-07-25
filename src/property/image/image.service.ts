import { Injectable } from '@nestjs/common';
import { PropertyService } from '../property.service.js';
import { ImageRepository } from './image.repository.js';

@Injectable()
export class ImageService {
  constructor(
    private readonly imageRepository: ImageRepository,
    private readonly propertyService: PropertyService,
  ) {}
}
