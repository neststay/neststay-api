import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '../../config/index.js';
import { UserService } from '../../user/user.service.js';

interface JwtPayload {
  sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly userService: UserService,
  ) {
    const jwtConfig = config.getOrThrow('jwt');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate({ sub }: JwtPayload): Promise<{ userId: bigint }> {
    const user = await this.userService.findBySlug({ slug: sub });
    if (!user) throw new UnauthorizedException();
    return { userId: user.id };
  }
}
