import { Entity, Property, Unique } from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../../../common/entities/base.entity.js';

@Entity({ tableName: 'categories' })
export class Category extends BaseEntity {
  @Property({ type: 'string' })
  @Unique()
  name!: string;

  @Property({ type: 'string' })
  slug!: string;
}
