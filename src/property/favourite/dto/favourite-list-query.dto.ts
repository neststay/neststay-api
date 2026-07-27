import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export class FavouriteListQueryDto {
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

export const FavouriteListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type FavouriteListQueryInput = z.infer<typeof FavouriteListQuerySchema>;
