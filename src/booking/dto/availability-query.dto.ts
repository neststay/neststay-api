import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export class AvailabilityQueryDto {
  @ApiProperty({
    type: String,
    description: 'Check-in date (inclusive)',
    example: '2026-09-01',
  })
  startDate: string;

  @ApiProperty({
    type: String,
    description: 'Check-out date (exclusive)',
    example: '2026-09-05',
  })
  endDate: string;
}

export const AvailabilityQuerySchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });

export type AvailabilityQueryInput = z.infer<typeof AvailabilityQuerySchema>;
