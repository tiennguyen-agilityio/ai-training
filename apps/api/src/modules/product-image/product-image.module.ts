import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProductImageService } from './services/product-image.service.js';
import { ProductImage } from './entities/product-image.entity.js';
import { ProductImageRepository } from './repositories/product-image.repository.js';

@Module({
  imports: [MikroOrmModule.forFeature([ProductImage])],
  providers: [ProductImageService, ProductImageRepository],
  exports: [ProductImageService],
})
export class ProductImageModule {}
