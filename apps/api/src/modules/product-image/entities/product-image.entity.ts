import { Opt } from '@mikro-orm/core';
import type { Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Product } from '../../product/entities/product.entity.js';

@Entity({ tableName: 'product_images' })
export class ProductImage extends BaseEntity {
  @ManyToOne(() => Product, { updateRule: 'cascade' })
  product!: Rel<Product>;

  @Property({ type: 'text' })
  url!: string;

  @Property({ type: 'boolean', fieldName: 'is_primary' })
  isPrimary: boolean & Opt = false;

  @Property({ type: 'number', fieldName: 'sort_order' })
  sortOrder: number & Opt = 0;
}
