import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUserOptional = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): bigint | null => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: { userId: bigint } }>();
    return request.user?.userId ?? null;
  },
);
