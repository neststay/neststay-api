import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export class CreatePropertyDto {
  @ApiProperty({ type: Number, description: 'Location ID', example: 1 })
  locationId: number;

  @ApiProperty({ type: Number, description: 'Place type ID', example: 1 })
  placeTypeId: number;

  @ApiProperty({ type: Number, description: 'Nightly rate', example: 99.99 })
  nightlyRate: number;

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

  @ApiProperty({ type: Number, description: 'Number of guests', example: 2 })
  numberOfGuests: number;

  @ApiProperty({ type: Number, description: 'Number of bedrooms', example: 1 })
  numberOfBedrooms: number;

  @ApiProperty({ type: Number, description: 'Number of bathrooms', example: 1 })
  numberOfBathrooms: number;
}

export const CreatePropertySchema = z.object({
  locationId: z.coerce.number().int().positive(),
  placeTypeId: z.coerce.number().int().positive(),
  nightlyRate: z.coerce.number().positive(),
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  numberOfGuests: z.coerce.number().int().positive(),
  numberOfBedrooms: z.coerce.number().int().positive(),
  numberOfBathrooms: z.coerce.number().int().positive(),
});

export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;
