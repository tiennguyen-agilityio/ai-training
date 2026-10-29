import { z } from 'zod';
import { VALIDATION_RULES, UserRole, UserStatus } from '@repo/constants';
import { nameField } from '../fields/text.js';

export const createUserSchema = z.object({
  clerkId: z.string().regex(VALIDATION_RULES.CLERK_ID.REGEX),
  email: z.email(),
  firstName: nameField,
  lastName: nameField,
  phoneNumber: z.string().regex(VALIDATION_RULES.PHONE.REGEX).nullish(),
  avatarUrl: z
    .url({ protocol: /^https?$/, hostname: z.regexes.domain })
    .nullish(),
  role: z.enum(UserRole).optional(),
});

// Admin-editable fields only — phoneNumber is Clerk-owned and mirrored in locally by
// the `user.updated` webhook, not something an admin sets by hand.
export const updateUserSchema = createUserSchema
  .omit({ clerkId: true, email: true, phoneNumber: true })
  .partial()
  .extend({ status: z.enum(UserStatus).optional() });

export type UpdateUserPayload = z.input<typeof updateUserSchema>;
