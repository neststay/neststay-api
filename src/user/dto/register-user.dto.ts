import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export class RegisterUserDto {
  @ApiProperty({
    type: String,
    description: 'Full name',
    example: 'Amitav Roy',
  })
  name: string;

  @ApiProperty({
    type: String,
    description: 'Email address',
    example: 'reachme@amitavroy.com',
  })
  email: string;

  @ApiProperty({
    type: String,
    description: 'Password (min 8 chars)',
    example: 'Password@123',
    format: 'password',
  })
  password: string;
}

export const RegisterUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8),
});
