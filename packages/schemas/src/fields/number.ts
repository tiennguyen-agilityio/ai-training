import { z } from 'zod';
import { VALIDATION_RULES } from '@repo/constants';

const { WEIGHT, PRICE, DISCOUNT, QUANTITY } = VALIDATION_RULES;

// Bare rules on numbers; the API coerces its input into them.
export const weightField = z.number().min(WEIGHT.MIN).max(WEIGHT.MAX);

export const priceField = z.number().min(PRICE.MIN).max(PRICE.MAX);

export const discountValueField = z
  .number()
  .min(DISCOUNT.MIN)
  .max(DISCOUNT.MAX);

export const quantityField = z.int().min(QUANTITY.MIN);
