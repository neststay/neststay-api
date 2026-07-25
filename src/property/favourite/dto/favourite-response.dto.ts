import { ApiProperty } from '@nestjs/swagger';

export class FavouriteResponseDto {
  @ApiProperty({
    type: String,
    description: 'Property slug',
    example: 'cozy-cabin-in-the-woods',
  })
  slug: string;

  @ApiProperty({
    type: Boolean,
    description: 'Whether the property is now favourited by the current user',
    example: true,
  })
  isFavourite: boolean;
}
