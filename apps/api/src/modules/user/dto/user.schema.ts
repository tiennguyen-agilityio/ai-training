import { z } from 'zod';
import {
  paginationQuerySchema,
  type PaginationQueryInput,
} from '../../../common/dto/pagination.schema.js';
import { VALIDATION_RULES } from '../../../common/constants/validation.constant.js';
import { UserRole, UserStatus } from '../../../common/enums/user.enum.js';

export const createUserSchema = z.object({
  clerkId: z.string().regex(VALIDATION_RULES.CLERK_ID.REGEX),
  email: z.email(),
  firstName: z
    .string()
    .min(VALIDATION_RULES.NAME.MIN_LENGTH)
    .max(VALIDATION_RULES.NAME.MAX_LENGTH),
  lastName: z
    .string()
    .min(VALIDATION_RULES.NAME.MIN_LENGTH)
    .max(VALIDATION_RULES.NAME.MAX_LENGTH),
  phoneNumber: z.string().regex(VALIDATION_RULES.PHONE.REGEX).nullish(),
  avatarUrl: z
    .url({ protocol: /^https?$/, hostname: z.regexes.domain })
    .nullish(),
  role: z.enum(UserRole).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Admin-editable fields only — phoneNumber is Clerk-owned and mirrored in locally by
// the `user.updated` webhook (see UserProfileSyncInput), not something an admin sets by hand.
export const updateUserSchema = createUserSchema
  .omit({ clerkId: true, email: true, phoneNumber: true })
  .partial()
  .extend({ status: z.enum(UserStatus).optional() });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Shape of the `user.updated` webhook's local sync write (ClerkWebhookService), which mirrors
// every provider-owned profile field — including phoneNumber — unlike the admin-facing
// updateUserSchema above. Never validated by StandardSchemaValidationPipe; the webhook calls
// UserService.update() directly, so this is a plain type, not a Zod schema.
export type UserProfileSyncInput = Partial<
  Pick<
    CreateUserInput,
    'firstName' | 'lastName' | 'phoneNumber' | 'avatarUrl' | 'role'
  >
> & { status?: UserStatus };

export const userQuerySchema = paginationQuerySchema.extend({
  role: z.enum(UserRole).optional(),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;

export type UserFilters = Omit<UserQueryInput, keyof PaginationQueryInput>;
