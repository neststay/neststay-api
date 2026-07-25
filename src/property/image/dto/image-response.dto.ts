import { ApiProperty } from '@nestjs/swagger';

export class ImageResponseDto {
  @ApiProperty({ type: String, description: 'Image ID', example: '1' })
  id: string;

  @ApiProperty({
    type: String,
    description: 'Image URL',
    example: 'https://example.com/images/property-1.jpg',
  })
  url: string;

  @ApiProperty({ type: Number, description: 'Display order', example: 0 })
  order: number;

  @ApiProperty({ type: Date, description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ type: Date, description: 'Last update timestamp' })
  updatedAt: Date;
}
