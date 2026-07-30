import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export class SearchQueryDto {
  @ApiProperty({
    type: String,
    description: 'Search text',
    example: 'beach house',
  })
  q: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Location name to filter by',
    example: 'Goa',
  })
  locationName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Place type name to filter by',
    example: 'Apartment',
  })
  placeTypeName?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Minimum nightly rate',
    example: 50,
  })
  minNightlyRate?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Maximum nightly rate',
    example: 200,
  })
  maxNightlyRate?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of guests to filter by',
    example: 2,
  })
  numberOfGuests?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of bedrooms to filter by',
    example: 1,
  })
  numberOfBedrooms?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of bathrooms to filter by',
    example: 1,
  })
  numberOfBathrooms?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of items per page (max 50)',
    example: 10,
    default: 10,
  })
  limit?: number;
}

export const SearchQuerySchema = z.object({
  q: z.string().min(1),
  locationName: z.string().min(1).optional(),
  placeTypeName: z.string().min(1).optional(),
  minNightlyRate: z.coerce.number().nonnegative().optional(),
  maxNightlyRate: z.coerce.number().nonnegative().optional(),
  numberOfGuests: z.coerce.number().int().positive().optional(),
  numberOfBedrooms: z.coerce.number().int().positive().optional(),
  numberOfBathrooms: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
