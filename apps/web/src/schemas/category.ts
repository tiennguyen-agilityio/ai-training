import { z } from 'zod'

import { ERROR_MESSAGES, VALIDATION_MESSAGES } from '@/constants/messages'
import { formDataEntryToString } from '@/utils/validation'
import { VALIDATION_RULES } from '@/constants/validation'

const { NAME } = VALIDATION_RULES

export const createCategoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: ERROR_MESSAGES.FIELD_REQUIRED })
    .min(NAME.MIN_LENGTH, {
      message: VALIDATION_MESSAGES.minLength('Name', NAME.MIN_LENGTH),
    })
    .max(NAME.MAX_LENGTH, {
      message: VALIDATION_MESSAGES.maxLength('Name', NAME.MAX_LENGTH),
    }),
})

export type CreateCategoryFormValues = z.infer<typeof createCategoryFormSchema>

export const parseCreateCategoryForm = (formData: FormData) =>
  createCategoryFormSchema.safeParse({
    name: formDataEntryToString(formData.get('name')),
  })
