import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../entities/product.entity.js';
import { RoastLevel, ProductStatus } from '../enums/product.enum.js';
import { ResponseProductImageDto } from '../../product-image/dto/response-product-image.dto.js';
import { ResponseProductVariantDto } from '../../product-variant/dto/response-product-variant.dto.js';

export class ResponseProductDto {
  id!: string;
  categoryId!: string;
  name!: string;
  slug!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  description: string | null = null;

  @ApiPropertyOptional({ enum: RoastLevel, nullable: true })
  roastLevel: RoastLevel | null = null;

  isOrganic!: boolean;
  isFairTrade!: boolean;

  @ApiProperty({ enum: ProductStatus })
  status!: ProductStatus;

  @ApiPropertyOptional({ nullable: true, type: String })
  tastingNotes: string | null = null;

  @ApiPropertyOptional({ nullable: true, type: String })
  origin: string | null = null;

  @ApiPropertyOptional({ nullable: true, type: String })
  processingMethod: string | null = null;

  createdAt!: Date;
  deletedAt!: Date | null;

  @ApiProperty({ type: () => ResponseProductImageDto, isArray: true })
  images!: ResponseProductImageDto[];

  @ApiProperty({ type: () => ResponseProductVariantDto, isArray: true })
  variants!: ResponseProductVariantDto[];

  static fromEntity(product: Product): ResponseProductDto {
    const dto = new ResponseProductDto();
    dto.id = product.id;
    dto.categoryId = product.category.id;
    dto.name = product.name;
    dto.slug = product.slug;
    dto.description = product.description;
    dto.roastLevel = product.roastLevel;
    dto.isOrganic = product.isOrganic;
    dto.isFairTrade = product.isFairTrade;
    dto.status = product.status;
    dto.tastingNotes = product.tastingNotes;
    dto.origin = product.origin;
    dto.processingMethod = product.processingMethod;
    dto.createdAt = product.createdAt;
    dto.deletedAt = product.deletedAt;
    dto.images = product.images
      .getItems()
      .filter((image) => !image.deletedAt)
      .map((image) => ResponseProductImageDto.fromEntity(image));
    dto.variants = product.variants
      .getItems()
      .map((variant) => ResponseProductVariantDto.fromEntity(variant));
    return dto;
  }
}
