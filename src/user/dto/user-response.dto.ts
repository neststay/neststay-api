export class UserResponseDto {
  slug: string;
  name: string | null;
  email: string;
  lastLoggedIn: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
