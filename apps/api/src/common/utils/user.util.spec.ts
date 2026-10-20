import { isActiveAdmin } from './user.util.js';
import { UserRole, UserStatus } from '../enums/user.enum.js';
import type { User } from '../../modules/user/entities/user.entity.js';

describe('isActiveAdmin', () => {
  it('returns true for an active admin', () => {
    expect(
      isActiveAdmin({
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      } as User),
    ).toBe(true);
  });

  it('returns false for an inactive admin', () => {
    expect(
      isActiveAdmin({
        role: UserRole.ADMIN,
        status: UserStatus.INACTIVE,
      } as User),
    ).toBe(false);
  });

  it('returns false for a non-admin user', () => {
    expect(
      isActiveAdmin({ role: UserRole.USER, status: UserStatus.ACTIVE } as User),
    ).toBe(false);
  });

  it('returns false when there is no user', () => {
    expect(isActiveAdmin(undefined)).toBe(false);
  });
});
