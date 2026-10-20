import { v4 as uuidv4 } from 'uuid';
import { Opt } from '@mikro-orm/core';
import {
  Entity,
  Filter,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';

@Entity({ abstract: true })
@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
export abstract class BaseEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string & Opt = uuidv4();

  @Property({ type: Date, onCreate: () => new Date() })
  createdAt: Date & Opt = new Date();

  @Property({
    type: Date,
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt: Date & Opt = new Date();

  @Property({ type: Date, nullable: true })
  deletedAt: Date | null = null;
}
