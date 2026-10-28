import { DiscountType, VALIDATION_RULES } from '@repo/constants';

const { DISCOUNT } = VALIDATION_RULES;

export const DISCOUNT_PERCENT_MESSAGE = `DiscountValue must be less than ${DISCOUNT.PERCENT_MAX} when DiscountType is ${DiscountType.PERCENT}`;

interface DiscountFields {
  discountType?: DiscountType | null;
  discountValue?: number | string | null;
}

// A percent discount must stay strictly below PERCENT_MAX. discountValue is a
// string once the API has transformed it.
export const isDiscountPercentValid = ({
  discountType,
  discountValue,
}: DiscountFields): boolean =>
  discountType !== DiscountType.PERCENT ||
  discountValue === undefined ||
  discountValue === null ||
  Number(discountValue) < DISCOUNT.PERCENT_MAX;

// Refinement params: `.refine(isDiscountPercentValid, discountPercentIssue())`.
// A new object per call: Zod rewrites the params it is given (message ->
// error) and prefixes issue paths in place, so a shared object would change.
export const discountPercentIssue = () => ({
  message: DISCOUNT_PERCENT_MESSAGE,
  path: ['discountValue'],
});
