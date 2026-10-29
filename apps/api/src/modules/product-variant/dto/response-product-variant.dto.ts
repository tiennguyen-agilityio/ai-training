import { ApiProperty } from '@nestjs/swagger';
import { ProductVariant } from '../entities/product-variant.entity.js';
import { DiscountType, ProductUnit } from '@repo/constants';

export class ResponseProductVariantDto {
  id!: string;
  sku!: string;

  weight!: number;

  @ApiProperty({ enum: ProductUnit })
  unit!: ProductUnit;

  name!: string;
  price!: number;

  @ApiProperty({ enum: DiscountType })
  discountType!: DiscountType;

  discountValue!: number;

  quantity!: number;

  static fromEntity(variant: ProductVariant): ResponseProductVariantDto {
    const dto = new ResponseProductVariantDto();
    dto.id = variant.id;
    dto.sku = variant.sku;
    dto.weight = Number(variant.weight);
    dto.unit = variant.unit;
    dto.name = variant.name;
    dto.price = Number(variant.price);
    // A variant stored before discounts were required may hold nulls; they
    // read field by field as no discount (PERCENT, 0).
    dto.discountType = variant.discountType ?? DiscountType.PERCENT;
    dto.discountValue = Number(variant.discountValue ?? 0);
    dto.quantity = variant.quantity;
    return dto;
  }
}
