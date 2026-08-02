import { ApiProperty } from '@nestjs/swagger';

export class BookingResponseDto {
  @ApiProperty({
    type: String,
    description: 'Booking slug (confirmation code)',
    example: '7K4M9XQ2',
  })
  slug: string;

  @ApiProperty({
    type: String,
    description: 'Slug of the booked property',
    example: '01JABC1234567890ABCDEFGH',
  })
  propertySlug: string;

  @ApiProperty({
    type: String,
    description: 'Check-in date (inclusive)',
    example: '2026-09-01',
  })
  checkInDate: Date;

  @ApiProperty({
    type: String,
    description: 'Check-out date (exclusive)',
    example: '2026-09-05',
  })
  checkOutDate: Date;

  @ApiProperty({
    type: String,
    description: 'Nightly rate at time of booking',
    example: '99.99',
  })
  nightlyRate: string;

  @ApiProperty({
    type: String,
    description: 'Total amount for the stay',
    example: '399.96',
  })
  totalAmount: string;

  @ApiProperty({
    type: String,
    description: 'Payment status',
    example: 'done',
  })
  paymentStatus: string;

  @ApiProperty({ type: Date, description: 'Creation timestamp' })
  createdAt: Date;
}
