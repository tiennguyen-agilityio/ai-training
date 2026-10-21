import { z } from 'zod'

import { ERROR_MESSAGES, VALIDATION_MESSAGES } from '@/constants/messages'
import { VALIDATION_RULES } from '@/constants/validation'
import { formDataEntryToString } from '@/utils/validation'
import { USER_ROLES, USER_STATUS } from '@/types/user'

const { NAME } = VALIDATION_RULES

const firstNameSchema = z
  .string()
  .trim()
  .min(1, ERROR_MESSAGES.FIRST_NAME_REQUIRED)
  .min(
    NAME.MIN_LENGTH,
    VALIDATION_MESSAGES.minLength('FirstName', NAME.MIN_LENGTH),
  )
  .max(
    NAME.MAX_LENGTH,
    VALIDATION_MESSAGES.maxLength('FirstName', NAME.MAX_LENGTH),
  )

const lastNameSchema = z
  .string()
  .trim()
  .min(1, ERROR_MESSAGES.LAST_NAME_REQUIRED)
  .min(
    NAME.MIN_LENGTH,
    VALIDATION_MESSAGES.minLength('LastName', NAME.MIN_LENGTH),
  )
  .max(
    NAME.MAX_LENGTH,
    VALIDATION_MESSAGES.maxLength('LastName', NAME.MAX_LENGTH),
  )

export const signInCredentialsSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, ERROR_MESSAGES.IDENTIFIER_REQUIRED)
    .email(ERROR_MESSAGES.IDENTIFIER_EMAIL_INVALID),
  password: z.string().trim().min(1, ERROR_MESSAGES.PASSWORD_REQUIRED),
})

export type SignInCredentialsValues = z.infer<typeof signInCredentialsSchema>

export const parseSignInCredentialsForm = (formData: FormData) =>
  signInCredentialsSchema.safeParse({
    identifier: formDataEntryToString(formData.get('identifier')),
    password: formDataEntryToString(formData.get('password')),
  })

export const signUpStartSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  emailAddress: z
    .string()
    .trim()
    .min(1, ERROR_MESSAGES.EMAIL_ADDRESS_REQUIRED)
    .email(ERROR_MESSAGES.EMAIL_ADDRESS_INVALID),
  password: z
    .string()
    .trim()
    .min(1, ERROR_MESSAGES.PASSWORD_REQUIRED)
    .min(8, ERROR_MESSAGES.PASSWORD_MIN_LENGTH),
})

export type SignUpStartValues = z.infer<typeof signUpStartSchema>

export const parseSignUpStartForm = (formData: FormData) =>
  signUpStartSchema.safeParse({
    firstName: formDataEntryToString(formData.get('firstName')),
    lastName: formDataEntryToString(formData.get('lastName')),
    emailAddress: formDataEntryToString(formData.get('emailAddress')),
    password: formDataEntryToString(formData.get('password')),
  })

export const updateProfileSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
})

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>

export const updateUserFormSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  role: z.nativeEnum(USER_ROLES),
  status: z.nativeEnum(USER_STATUS),
})

export type UpdateUserFormValues = z.infer<typeof updateUserFormSchema>
