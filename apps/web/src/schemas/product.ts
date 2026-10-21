import { z } from 'zod'

import { ERROR_MESSAGES, VALIDATION_MESSAGES } from '@/constants/messages'
import { VALIDATION_RULES } from '@/constants/validation'
import { formatNumberThousands } from '@/utils/number'
import { DISCOUNT_TYPE, PRODUCT_UNIT, ROAST_LEVEL } from '@/types/product'

const { NAME, PRICE, WEIGHT, DISCOUNT, QUANTITY } = VALIDATION_RULES

// Shows a friendlier rounded number (e.g. 99999999.99 -> "100,000,000")
// than the raw API cap, which has an unwieldy .99 remainder.
const numberInRange = (label: string, min: number, max: number) =>
  z
    .number({ error: ERROR_MESSAGES.FIELD_REQUIRED })
    .refine((value) => Number.isFinite(value) && value >= min, {
      message: VALIDATION_MESSAGES.min(label, formatNumberThousands(min)),
    })
    .refine((value) => Number.isFinite(value) && value <= max, {
      message: VALIDATION_MESSAGES.max(label, formatNumberThousands(max)),
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
    roastLevel: z.nativeEnum(ROAST_LEVEL),
    isOrganic: z.boolean(),
    isFairTrade: z.boolean(),
    weight: numberInRange('Weight', WEIGHT.MIN, WEIGHT.MAX),
    unit: z
      .union([z.literal(''), z.nativeEnum(PRODUCT_UNIT)], {
        error: ERROR_MESSAGES.FIELD_REQUIRED,
      })
      .refine((value) => value !== '', {
        message: ERROR_MESSAGES.FIELD_REQUIRED,
      }),
    price: numberInRange('Price', PRICE.MIN, PRICE.MAX),
    discountType: z.nativeEnum(DISCOUNT_TYPE),
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
    // API requires discountValue strictly < PERCENT_MAX (100), not <=.
    if (
      data.discountType === DISCOUNT_TYPE.PERCENT &&
      data.discountValue >= DISCOUNT.PERCENT_MAX
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: ERROR_MESSAGES.DISCOUNT_PERCENT_MAX,
      })
    }

    if (
      data.discountType === DISCOUNT_TYPE.FIXED &&
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
  roastLevel: z.nativeEnum(ROAST_LEVEL),
  isOrganic: z.boolean(),
  isFairTrade: z.boolean(),
  origin: originSchema,
  processingMethod: processingMethodSchema,
})

export type EditProductFormValues = z.infer<typeof editProductFormSchema>
