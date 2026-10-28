import { z } from 'zod'

import {
  VALIDATION_MESSAGES,
  VALIDATION_RULES,
  DiscountType,
  ProductUnit,
  RoastLevel,
} from '@repo/constants'
import { DISCOUNT_PERCENT_MESSAGE, isDiscountPercentValid } from '@repo/schemas'
import { ERROR_MESSAGES } from '@/constants/messages'
import { formatNumberThousands } from '@/utils/number'

const { NAME, PRICE, WEIGHT, DISCOUNT, QUANTITY } = VALIDATION_RULES

// Exact bound with thousand separators, e.g. 99999999.99 -> "99,999,999.99":
// formatting is the UI's job, the shared message only interpolates it.
const formatBound = (value: number) =>
  formatNumberThousands(value, Number.isInteger(value) ? 0 : 2)

const numberInRange = (label: string, min: number, max: number) =>
  z
    .number({ error: ERROR_MESSAGES.FIELD_REQUIRED })
    .refine((value) => Number.isFinite(value) && value >= min, {
      message: VALIDATION_MESSAGES.min(label, formatBound(min)),
    })
    .refine((value) => Number.isFinite(value) && value <= max, {
      message: VALIDATION_MESSAGES.max(label, formatBound(max)),
    })

// label matches the API's raw DTO field name (capitalize-first-letter only,
// e.g. "processingMethod" -> "ProcessingMethod") so the message is identical
// to what validation-error.util.ts would return for the same constraint.
const textFieldSchema = (
  label: string,
  minLength: number,
  maxLength?: number,
) => {
  let schema = z
    .string()
    .trim()
    .min(1, { message: ERROR_MESSAGES.FIELD_REQUIRED })
    .min(minLength, {
      message: VALIDATION_MESSAGES.minLength(label, minLength),
    })

  if (maxLength !== undefined) {
    schema = schema.max(maxLength, {
      message: VALIDATION_MESSAGES.maxLength(label, maxLength),
    })
  }

  return schema
}

const nameSchema = textFieldSchema('Name', NAME.MIN_LENGTH, NAME.MAX_LENGTH)
const descriptionSchema = textFieldSchema('Description', NAME.MIN_LENGTH)
const originSchema = textFieldSchema('Origin', NAME.MIN_LENGTH)
const processingMethodSchema = textFieldSchema(
  'ProcessingMethod',
  NAME.MIN_LENGTH,
)

export const createProductFormSchema = z
  .object({
    categoryId: z
      .string()
      .trim()
      .min(1, { message: ERROR_MESSAGES.FIELD_REQUIRED }),
    name: nameSchema,
    description: descriptionSchema,
    roastLevel: z.nativeEnum(RoastLevel),
    isOrganic: z.boolean(),
    isFairTrade: z.boolean(),
    weight: numberInRange('Weight', WEIGHT.MIN, WEIGHT.MAX),
    unit: z
      .union([z.literal(''), z.nativeEnum(ProductUnit)], {
        error: ERROR_MESSAGES.FIELD_REQUIRED,
      })
      .refine((value) => value !== '', {
        message: ERROR_MESSAGES.FIELD_REQUIRED,
      }),
    price: numberInRange('Price', PRICE.MIN, PRICE.MAX),
    discountType: z.nativeEnum(DiscountType),
    discountValue: numberInRange('DiscountValue', DISCOUNT.MIN, DISCOUNT.MAX),
    quantity: z
      .union(
        [
          z.literal(''),
          z
            .number()
            .int({ message: VALIDATION_MESSAGES.isInt('Quantity') })
            .min(QUANTITY.MIN, {
              message: VALIDATION_MESSAGES.min('Quantity', QUANTITY.MIN),
            }),
        ],
        { error: ERROR_MESSAGES.FIELD_REQUIRED },
      )
      .refine((value) => value !== '', {
        message: ERROR_MESSAGES.FIELD_REQUIRED,
      }),
    origin: originSchema,
    processingMethod: processingMethodSchema,
  })
  .superRefine((data, ctx) => {
    if (!isDiscountPercentValid(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: DISCOUNT_PERCENT_MESSAGE,
      })
    }

    if (
      data.discountType === DiscountType.FIXED &&
      data.discountValue >= data.price
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: ERROR_MESSAGES.DISCOUNT_FIXED_MUST_BE_LESS_THAN_PRICE,
      })
    }
  })

export type CreateProductFormValues = z.infer<typeof createProductFormSchema>

export const editProductFormSchema = z.object({
  categoryId: z
    .string()
    .trim()
    .min(1, { message: ERROR_MESSAGES.FIELD_REQUIRED }),
  name: nameSchema,
  description: descriptionSchema,
  roastLevel: z.nativeEnum(RoastLevel),
  isOrganic: z.boolean(),
  isFairTrade: z.boolean(),
  origin: originSchema,
  processingMethod: processingMethodSchema,
})

export type EditProductFormValues = z.infer<typeof editProductFormSchema>
