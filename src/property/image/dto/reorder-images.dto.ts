import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export class ReorderImagesDto {
  @ApiProperty({
    type: [Number],
    description: 'Ordered list of image ids, first-to-last display order',
    example: [3, 1, 2],
  })
  imageIds: number[];
}

export const ReorderImagesSchema = z.object({
  imageIds: z.array(z.coerce.number().int().positive()).min(1),
});

export type ReorderImagesInput = z.infer<typeof ReorderImagesSchema>;
