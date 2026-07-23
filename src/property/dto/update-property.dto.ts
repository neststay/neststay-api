import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export class UpdatePropertyDto {
  @ApiPropertyOptional({ type: Number, description: 'Location ID', example: 1 })
  locationId?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Place type ID',
    example: 1,
  })
  placeTypeId?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Nightly rate',
    example: 99.99,
  })
  nightlyRate?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Property name',
    example: 'Cozy downtown apartment',
  })
  name?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Property description',
    example: 'A cozy apartment in the city center',
  })
  description?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of guests',
    example: 2,
  })
  numberOfGuests?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of bedrooms',
    example: 1,
  })
  numberOfBedrooms?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of bathrooms',
    example: 1,
  })
  numberOfBathrooms?: number;
}

export const UpdatePropertySchema = z.object({
  locationId: z.coerce.number().int().positive().optional(),
  placeTypeId: z.coerce.number().int().positive().optional(),
  nightlyRate: z.coerce.number().positive().optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  numberOfGuests: z.coerce.number().int().positive().optional(),
  numberOfBedrooms: z.coerce.number().int().positive().optional(),
  numberOfBathrooms: z.coerce.number().int().positive().optional(),
});

export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>;
