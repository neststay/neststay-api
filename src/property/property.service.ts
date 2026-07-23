import { Injectable } from '@nestjs/common';
import { PropertyRepository } from './property.repository.js';

@Injectable()
export class PropertyService {
  constructor(private readonly propertyRepository: PropertyRepository) {}
}
