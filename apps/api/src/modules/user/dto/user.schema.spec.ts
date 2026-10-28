import { userQuerySchema } from './user.schema.js';
import { UserStatus } from '@repo/constants';

describe('userQuerySchema', () => {
  it('accepts ACTIVE and INACTIVE as status', () => {
    const active = userQuerySchema.safeParse({ status: 'ACTIVE' });
    const inactive = userQuerySchema.safeParse({ status: 'INACTIVE' });

    expect(active.success).toBe(true);
    expect(active.data?.status).toBe(UserStatus.ACTIVE);
    expect(inactive.success).toBe(true);
    expect(inactive.data?.status).toBe(UserStatus.INACTIVE);
  });

  it('rejects an unknown status', () => {
    expect(userQuerySchema.safeParse({ status: 'DISABLED' }).success).toBe(
      false,
    );
  });

  it('leaves status undefined when omitted', () => {
    const result = userQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.data?.status).toBeUndefined();
  });
});
