import { z } from 'zod';
import {
  paginationQuerySchema,
  type PaginationQueryInput,
} from '../../../common/dto/pagination.schema.js';
import { UserRole, UserStatus } from '@repo/constants';
import { createUserSchema, updateUserSchema } from '@repo/schemas';

export { createUserSchema, updateUserSchema };

export type CreateUserInput = z.infer<typeof createUserSchema>;

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Shape of the `user.updated` webhook's local sync write (ClerkWebhookService), which mirrors
// every provider-owned profile field — including phoneNumber — unlike the admin-facing
// updateUserSchema (from @repo/schemas). Never validated by StandardSchemaValidationPipe; the webhook calls
// UserService.update() directly, so this is a plain type, not a Zod schema.
export type UserProfileSyncInput = Partial<
  Pick<
    CreateUserInput,
    'firstName' | 'lastName' | 'phoneNumber' | 'avatarUrl' | 'role'
  >
> & { status?: UserStatus };

export const userQuerySchema = paginationQuerySchema.extend({
  role: z.enum(UserRole).optional(),
  status: z.enum(UserStatus).optional(),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;

export type UserFilters = Omit<UserQueryInput, keyof PaginationQueryInput>;
