import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    type: String,
    description: 'User slug',
    example: '01JABC1234567890ABCDEFGH',
  })
  slug: string;

  @ApiProperty({
    type: String,
    description: 'Email address',
    example: 'jane@example.com',
  })
  email: string;
}
