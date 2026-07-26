import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): bigint => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: { userId: bigint } }>();
    return request.user.userId;
  },
);
