import { ApiProperty } from '@nestjs/swagger';

export class PropertyImageDto {
  @ApiProperty({
    type: String,
    description: 'Image URL',
    example: 'https://example.com/images/property-1.jpg',
  })
  url: string;

  @ApiProperty({ type: Number, description: 'Display order', example: 0 })
  order: number;
}
