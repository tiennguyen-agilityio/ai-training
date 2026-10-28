import { User } from '../../modules/user/entities/user.entity.js';
import { UserRole, UserStatus } from '@repo/constants';

export function isActiveAdmin(user?: User): boolean {
  return (
    user?.role === UserRole.ADMIN &&
    (user.status as UserStatus) === UserStatus.ACTIVE
  );
}
