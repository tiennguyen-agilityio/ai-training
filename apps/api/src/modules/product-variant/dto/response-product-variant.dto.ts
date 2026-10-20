import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductVariant } from '../entities/product-variant.entity.js';
import { DiscountType, ProductUnit } from '../enums/product-variant.enum.js';

export class ResponseProductVariantDto {
  id!: string;
  sku!: string;

  weight!: number;

  @ApiProperty({ enum: ProductUnit })
  unit!: ProductUnit;

  name!: string;
  price!: number;

  @ApiPropertyOptional({ enum: DiscountType, nullable: true })
  discountType: DiscountType | null = null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  discountValue: number | null = null;

  quantity!: number;

  static fromEntity(variant: ProductVariant): ResponseProductVariantDto {
    const dto = new ResponseProductVariantDto();
    dto.id = variant.id;
    dto.sku = variant.sku;
    dto.weight = Number(variant.weight);
    dto.unit = variant.unit;
    dto.name = variant.name;
    dto.price = Number(variant.price);
    dto.discountType = variant.discountType;
    dto.discountValue =
      variant.discountValue === null ? null : Number(variant.discountValue);
    dto.quantity = variant.quantity;
    return dto;
  }
}
