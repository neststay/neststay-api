import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export class CreateBookingDto {
  @ApiProperty({
    type: String,
    description: 'Slug of the property to book',
    example: '01JABC1234567890ABCDEFGH',
  })
  propertySlug: string;

  @ApiProperty({
    type: String,
    description: 'Check-in date (inclusive)',
    example: '2026-09-01',
  })
  checkInDate: string;

  @ApiProperty({
    type: String,
    description: 'Check-out date (exclusive)',
    example: '2026-09-05',
  })
  checkOutDate: string;
}

export const CreateBookingSchema = z
  .object({
    propertySlug: z.string().min(1),
    checkInDate: z.coerce.date(),
    checkOutDate: z.coerce.date(),
  })
  .refine((data) => data.checkOutDate > data.checkInDate, {
    message: 'checkOutDate must be after checkInDate',
    path: ['checkOutDate'],
  });

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
