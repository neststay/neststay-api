import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { UserController } from './user.controller.js';
import { UserRepository } from './user.repository.js';
import { UserService } from './user.service.js';
import { UserRegisterQueueListener } from './listeners/user-register-queue.listener.js';
import { AppConfig } from '../config/index.js';

@Module({
  imports: [
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
  controllers: [UserController],
  providers: [UserRepository, UserService, UserRegisterQueueListener],
  exports: [UserService],
})
export class UserModule {}
