import { User } from '../../modules/user/entities/user.entity.js';
import { UserRole, UserStatus } from '../enums/user.enum.js';

export function isActiveAdmin(user?: User): boolean {
  return (
    user?.role === UserRole.ADMIN &&
    (user.status as UserStatus) === UserStatus.ACTIVE
  );
}
