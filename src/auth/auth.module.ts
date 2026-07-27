import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { AppConfig } from '../config/index.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [
    PassportModule,
    UserModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<AppConfig, true>,
      ): JwtModuleOptions => {
        const jwtConfig = config.getOrThrow('jwt');
        return {
          secret: jwtConfig.secret,

          signOptions: { expiresIn: jwtConfig.expiresIn },
        };
      },
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard, OptionalJwtAuthGuard],
  exports: [JwtAuthGuard, OptionalJwtAuthGuard, PassportModule],
})
export class AuthModule {}
