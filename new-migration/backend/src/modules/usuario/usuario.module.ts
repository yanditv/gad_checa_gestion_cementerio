import { Module } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserController } from './usuario.controller';
import { UserService } from './usuario.service';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
