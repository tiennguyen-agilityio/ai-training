import { DiscountType, ProductUnit, RoastLevel } from '@repo/constants'
import { DISCOUNT_PERCENT_MESSAGE } from '@repo/schemas'

import { createProductFormSchema } from '@/schemas/product'

const valid = {
  categoryId: 'category-1',
  name: 'Single Origin',
  description: 'Bright and floral',
  roastLevel: RoastLevel.LIGHT,
  isOrganic: false,
  isFairTrade: false,
  weight: 1,
  unit: ProductUnit.KG,
  price: 10,
  discountType: DiscountType.PERCENT,
  discountValue: 0,
  quantity: 1,
  origin: 'Ethiopia',
  processingMethod: 'Washed',
}

function messagesFor(input: Record<string, unknown>, field: string) {
  const result = createProductFormSchema.safeParse(input)
  if (result.success) return []
  return result.error.issues
    .filter((issue) => issue.path[0] === field)
    .map((issue) => issue.message)
}

describe('createProductFormSchema', () => {
  it('accepts a valid product', () => {
    expect(createProductFormSchema.safeParse(valid).success).toBe(true)
  })

  it('uses the API max message with the bound formatted by web for Price', () => {
    expect(messagesFor({ ...valid, price: 100000000 }, 'price')).toContain(
      'Price must not be greater than 99,999,999.99',
    )
  })

  it('uses the API min message for Weight', () => {
    expect(messagesFor({ ...valid, weight: 0 }, 'weight')).toContain(
      'Weight must not be less than 1',
    )
  })

  it('uses the API max message for DiscountValue', () => {
    expect(
      messagesFor(
        {
          ...valid,
          discountType: DiscountType.FIXED,
          discountValue: 100000000,
        },
        'discountValue',
      ),
    ).toContain('DiscountValue must not be greater than 99,999,999.99')
  })

  it('uses the shared message for a percent discount of 100', () => {
    expect(
      messagesFor(
        { ...valid, discountType: DiscountType.PERCENT, discountValue: 100 },
        'discountValue',
      ),
    ).toEqual([DISCOUNT_PERCENT_MESSAGE])
  })

  it('accepts a percent discount of 99', () => {
    expect(
      createProductFormSchema.safeParse({
        ...valid,
        discountType: DiscountType.PERCENT,
        discountValue: 99,
      }).success,
    ).toBe(true)
  })
})
