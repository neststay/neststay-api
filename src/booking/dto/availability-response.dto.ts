import { ApiProperty } from '@nestjs/swagger';

export class AvailabilityResponseDto {
  @ApiProperty({
    type: Boolean,
    description: 'Whether the property is available for the requested dates',
    example: true,
  })
  isAvailable: boolean;
}
