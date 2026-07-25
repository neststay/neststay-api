import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ImageService } from './image.service.js';

@ApiTags('images')
@Controller('properties/:slug/images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}
}
