import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = { userId: bigint }>(
    _err: unknown,
    user: TUser | false,
  ): TUser | null {
    return user ? user : null;
  }
}
