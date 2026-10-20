import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CategoryService } from './services/category.service.js';
import { CategoryController } from './controllers/category.controller.js';
import { Category } from './entities/category.entity.js';
import { CategoryRepository } from './repositories/category.repository.js';

@Module({
  imports: [MikroOrmModule.forFeature([Category])],
  providers: [CategoryService, CategoryRepository],
  controllers: [CategoryController],
  exports: [CategoryService],
})
export class CategoryModule {}
