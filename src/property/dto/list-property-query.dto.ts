import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export class ListPropertyQueryDto {
  @ApiProperty({
    type: Number,
    description: 'Location ID to filter properties by',
    example: 1,
  })
  locationId: number;

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

export const ListPropertyQuerySchema = z.object({
  locationId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type ListPropertyQueryInput = z.infer<typeof ListPropertyQuerySchema>;
