import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export class CreateImageDto {
  @ApiProperty({
    type: String,
    description: 'Image URL',
    example: 'https://example.com/images/property-1.jpg',
  })
  url: string;

  @ApiProperty({
    type: Number,
    description: 'Display order',
    example: 0,
    required: false,
  })
  order?: number;
}

export const CreateImageSchema = z.object({
  url: z.string().url(),
  order: z.coerce.number().int().min(0).optional(),
});

export type CreateImageInput = z.infer<typeof CreateImageSchema>;
