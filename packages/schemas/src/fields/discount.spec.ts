import { z } from 'zod';
import { DiscountType } from '@repo/constants';
import {
  DISCOUNT_PERCENT_MESSAGE,
  discountPercentIssue,
  isDiscountPercentValid,
} from './discount.js';

describe('discount percent rule', () => {
  it('reads as the API message', () => {
    expect(DISCOUNT_PERCENT_MESSAGE).toBe(
      'DiscountValue must be less than 100 when DiscountType is PERCENT',
    );
  });

  it.each([
    [{ discountType: DiscountType.PERCENT, discountValue: 99 }, true],
    [{ discountType: DiscountType.PERCENT, discountValue: 100 }, false],
    [{ discountType: DiscountType.PERCENT, discountValue: '100' }, false],
    [{ discountType: DiscountType.FIXED, discountValue: 100 }, true],
    [{ discountType: DiscountType.PERCENT, discountValue: null }, true],
    [{}, true],
  ])('isDiscountPercentValid(%o) is %s', (fields, expected) => {
    expect(isDiscountPercentValid(fields)).toBe(expected);
  });

  it('gives each caller fresh params, which Zod cannot change for the next caller', () => {
    const schema = z
      .object({ items: z.array(z.object({ discountValue: z.number() })) })
      .superRefine((_data, ctx) => {
        ctx.addIssue({ code: 'custom', ...discountPercentIssue() });
      });
    z.object({}).refine(() => true, discountPercentIssue());
    schema.safeParse({ items: [] });

    expect(discountPercentIssue()).toEqual({
      message: DISCOUNT_PERCENT_MESSAGE,
      path: ['discountValue'],
    });
    expect(discountPercentIssue().path).not.toBe(discountPercentIssue().path);
  });

  it('puts the issue on discountValue when used as a refinement', () => {
    const schema = z
      .object({
        discountType: z.enum(DiscountType),
        discountValue: z.number(),
      })
      .refine(isDiscountPercentValid, discountPercentIssue());

    expect(
      schema.safeParse({
        discountType: DiscountType.PERCENT,
        discountValue: 100,
      }).error?.issues,
    ).toEqual([
      expect.objectContaining({
        code: 'custom',
        path: ['discountValue'],
        message: DISCOUNT_PERCENT_MESSAGE,
      }),
    ]);
  });
});
