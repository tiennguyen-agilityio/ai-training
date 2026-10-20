import { Opt } from '@mikro-orm/core';
import { Entity, Enum, Property, Unique } from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { UserRole, UserStatus } from '../../../common/enums/user.enum.js';

@Entity({ tableName: 'users' })
export class User extends BaseEntity {
  @Property({ type: 'string', fieldName: 'clerk_id' })
  @Unique()
  clerkId!: string;

  @Property({ type: 'string' })
  @Unique()
  email!: string;

  @Enum({ items: () => UserRole })
  role: UserRole & Opt = UserRole.USER;

  @Property({ type: 'string', fieldName: 'first_name' })
  firstName!: string;

  @Property({ type: 'string', fieldName: 'last_name' })
  lastName!: string;

  @Property({ type: 'string', fieldName: 'phone_number', nullable: true })
  phoneNumber: string | null = null;

  @Property({ type: 'string', fieldName: 'avatar_url', nullable: true })
  avatarUrl: string | null = null;

  @Enum({ items: () => UserStatus })
  status: UserStatus & Opt = UserStatus.ACTIVE;
}
