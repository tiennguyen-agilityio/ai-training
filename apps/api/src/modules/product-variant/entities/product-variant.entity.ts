import { Opt } from '@mikro-orm/core';
import type { Rel } from '@mikro-orm/core';
import {
  Entity,
  Enum,
  ManyToOne,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Product } from '../../product/entities/product.entity.js';
import { DiscountType, ProductUnit } from '../enums/product-variant.enum.js';

@Entity({ tableName: 'product_variants' })
export class ProductVariant extends BaseEntity {
  @ManyToOne(() => Product, { updateRule: 'cascade' })
  product!: Rel<Product>;

  @Property({ type: 'string' })
  @Unique()
  sku!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  weight!: string;

  @Enum({ items: () => ProductUnit })
  unit!: ProductUnit;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  price!: string;

  @Enum({
    items: () => DiscountType,
    fieldName: 'discount_type',
    nullable: true,
  })
  discountType: DiscountType | null = null;

  @Property({
    type: 'decimal',
    precision: 10,
    scale: 2,
    fieldName: 'discount_value',
    nullable: true,
  })
  discountValue: string | null = null;

  @Property({ type: 'number' })
  quantity: number & Opt = 0;
}
