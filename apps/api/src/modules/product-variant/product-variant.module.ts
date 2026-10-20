import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProductVariantService } from './services/product-variant.service.js';
import { ProductVariant } from './entities/product-variant.entity.js';
import { ProductVariantRepository } from './repositories/product-variant.repository.js';

@Module({
  imports: [MikroOrmModule.forFeature([ProductVariant])],
  providers: [ProductVariantService, ProductVariantRepository],
  exports: [ProductVariantService],
})
export class ProductVariantModule {}
