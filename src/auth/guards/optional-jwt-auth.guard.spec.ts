import { UnauthorizedException } from '@nestjs/common';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard.js';

describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;

  beforeEach(() => {
    guard = new OptionalJwtAuthGuard();
  });

  it('returns the user for a valid token', () => {
    const user = { userId: 1n };

    const result = guard.handleRequest(null, user);

    expect(result).toBe(user);
  });

  it('returns null instead of throwing when no token is present', () => {
    const result = guard.handleRequest(null, false);

    expect(result).toBeNull();
  });

  it('returns null instead of throwing for an invalid or expired token', () => {
    const result = guard.handleRequest(new UnauthorizedException(), false);

    expect(result).toBeNull();
  });
});
