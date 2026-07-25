import { ApiProperty } from '@nestjs/swagger';
import { PropertyImageDto } from './property-image.dto.js';

export class PropertyResponseDto {
  @ApiProperty({
    type: String,
    description: 'Property slug',
    example: '01JABC1234567890ABCDEFGH',
  })
  slug: string;

  @ApiProperty({
    type: String,
    description: 'Property name',
    example: 'Cozy downtown apartment',
  })
  name: string;

  @ApiProperty({
    type: String,
    description: 'Property description',
    example: 'A cozy apartment in the city center',
  })
  description: string;

  @ApiProperty({ type: String, description: 'Nightly rate', example: '99.99' })
  nightlyRate: string;

  @ApiProperty({ type: Number, description: 'Number of guests', example: 2 })
  numberOfGuests: number;

  @ApiProperty({ type: Number, description: 'Number of bedrooms', example: 1 })
  numberOfBedrooms: number;

  @ApiProperty({ type: Number, description: 'Number of bathrooms', example: 1 })
  numberOfBathrooms: number;

  @ApiProperty({ type: Date, description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ type: Date, description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ type: PropertyImageDto, isArray: true })
  images: PropertyImageDto[];
}
