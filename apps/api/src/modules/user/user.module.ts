import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserService } from './services/user.service.js';
import { UserController } from './controllers/user.controller.js';
import { User } from './entities/user.entity.js';
import { UserRepository } from './repositories/user.repository.js';

@Module({
  imports: [MikroOrmModule.forFeature([User])],
  providers: [UserService, UserRepository],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
