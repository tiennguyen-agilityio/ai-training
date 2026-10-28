import { z } from 'zod';
import { DiscountType, ProductUnit } from '@repo/constants';
import {
  discountPercentIssue,
  isDiscountPercentValid,
} from '../fields/discount.js';
import {
  discountValueField,
  priceField,
  quantityField,
  weightField,
} from '../fields/number.js';
import { skuField } from '../fields/text.js';

// Request bodies may send numbers as strings; decimals are stored as strings.
// `<number>` types the input as a number for payloads; parsing is unchanged.
const decimal = (field: z.ZodNumber) =>
  z.coerce.number<number>().pipe(field).transform(String);

export const createProductVariantSchema = z
  .object({
    sku: skuField,
    weight: decimal(weightField),
    unit: z.enum(ProductUnit),
    price: decimal(priceField),
    discountType: z.enum(DiscountType).nullable().optional(),
    discountValue: decimal(discountValueField).nullable().optional(),
    quantity: quantityField.optional(),
  })
  .refine(isDiscountPercentValid, discountPercentIssue());

export type CreateProductVariantPayload = z.input<
  typeof createProductVariantSchema
>;
