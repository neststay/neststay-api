import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PropertyService } from './property.service.js';

@ApiTags('properties')
@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}
}
