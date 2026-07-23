import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { AppConfig } from '../config/index.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<AppConfig, true>,
      ): JwtModuleOptions => {
        const jwtConfig = config.getOrThrow('jwt');
        return {
          secret: jwtConfig.secret,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          signOptions: { expiresIn: jwtConfig.expiresIn as any },
        };
      },
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, PassportModule],
})
export class AuthModule {}
