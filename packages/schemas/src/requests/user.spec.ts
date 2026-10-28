import { UserStatus } from '@repo/constants';
import { updateUserSchema } from './user.js';

describe('updateUserSchema', () => {
  it('drops the fields an admin does not set and keeps status', () => {
    expect(
      updateUserSchema.parse({
        clerkId: 'user_123',
        email: 'a@example.com',
        phoneNumber: '+84123456789',
        firstName: 'Linh',
        status: UserStatus.INACTIVE,
      }),
    ).toEqual({ firstName: 'Linh', status: UserStatus.INACTIVE });
  });
});
