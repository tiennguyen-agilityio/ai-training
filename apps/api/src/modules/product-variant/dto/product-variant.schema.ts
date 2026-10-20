import { z } from 'zod';
import { VALIDATION_RULES } from '../../../common/constants/validation.constant.js';
import { ERROR_MESSAGES } from '../../../common/constants/message.constant.js';
import { DiscountType, ProductUnit } from '../enums/product-variant.enum.js';

const decimal = (min: number, max: number) =>
  z.coerce.number().min(min).max(max).transform(String);

export const createProductVariantSchema = z
  .object({
    sku: z
      .string()
      .min(VALIDATION_RULES.SKU.MIN_LENGTH)
      .max(VALIDATION_RULES.SKU.MAX_LENGTH),
    weight: decimal(VALIDATION_RULES.WEIGHT.MIN, VALIDATION_RULES.WEIGHT.MAX),
    unit: z.enum(ProductUnit),
    price: decimal(VALIDATION_RULES.PRICE.MIN, VALIDATION_RULES.PRICE.MAX),
    discountType: z.enum(DiscountType).nullable().optional(),
    discountValue: decimal(
      VALIDATION_RULES.DISCOUNT.MIN,
      VALIDATION_RULES.DISCOUNT.MAX,
    )
      .nullable()
      .optional(),
    quantity: z.int().min(VALIDATION_RULES.QUANTITY.MIN).optional(),
  })
  .refine(
    (variant) =>
      variant.discountType !== DiscountType.PERCENT ||
      variant.discountValue === undefined ||
      variant.discountValue === null ||
      Number(variant.discountValue) < VALIDATION_RULES.DISCOUNT.PERCENT_MAX,
    {
      message: ERROR_MESSAGES.PRODUCT_VARIANT.INVALID_DISCOUNT_PERCENT,
      path: ['discountValue'],
    },
  );

export type CreateProductVariantInput = z.infer<
  typeof createProductVariantSchema
>;
