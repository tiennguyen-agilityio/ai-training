import { VALIDATION_RULES } from './validation-rules.js';

describe('VALIDATION_RULES', () => {
  it('matches the API rules', () => {
    expect(VALIDATION_RULES).toEqual({
      NAME: { MIN_LENGTH: 2, MAX_LENGTH: 120 },
      SKU: { MIN_LENGTH: 1, MAX_LENGTH: 255 },
      IMAGE: {
        MIN_COUNT: 2,
        MAX_COUNT: 6,
        MIN_SORT_ORDER: 0,
        MAX_SORT_ORDER: 5,
      },
      VARIANT: { MIN_COUNT: 1 },
      QUANTITY: { MIN: 0 },
      PRICE: { MIN: 1, MAX: 99999999.99 },
      WEIGHT: { MIN: 1, MAX: 99999999.99 },
      DISCOUNT: { MIN: 0, MAX: 99999999.99, PERCENT_MAX: 100 },
      PAGINATION: {
        MIN_PAGE: 1,
        DEFAULT_PAGE: 1,
        MIN_LIMIT: 1,
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 100,
      },
      PHONE: { REGEX: /^\d{10}$/ },
      CLERK_ID: { REGEX: /^user_[a-zA-Z0-9]+$/ },
    });
  });
});
