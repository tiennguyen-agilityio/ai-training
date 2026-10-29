import { DiscountType, VALIDATION_RULES } from '@repo/constants';

const { DISCOUNT } = VALIDATION_RULES;

export const DISCOUNT_PERCENT_MESSAGE = `DiscountValue must be less than ${DISCOUNT.PERCENT_MAX} when DiscountType is ${DiscountType.PERCENT}`;

export const DISCOUNT_FIXED_MESSAGE =
  'Fixed discount must be less than base price';

interface DiscountFields {
  discountType?: DiscountType | null;
  discountValue?: number | string | null;
}

interface FixedDiscountFields extends DiscountFields {
  price?: number | string | null;
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

// A fixed discount must stay strictly below the price, so the selling price
// stays above 0. Values may be strings once the API has transformed them.
export const isDiscountFixedValid = ({
  discountType,
  discountValue,
  price,
}: FixedDiscountFields): boolean =>
  discountType !== DiscountType.FIXED ||
  discountValue === undefined ||
  discountValue === null ||
  price === undefined ||
  price === null ||
  Number(discountValue) < Number(price);
