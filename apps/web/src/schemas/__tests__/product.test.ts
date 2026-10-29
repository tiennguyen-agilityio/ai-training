import { DiscountType, ProductUnit, RoastLevel } from '@repo/constants'
import { DISCOUNT_FIXED_MESSAGE, DISCOUNT_PERCENT_MESSAGE } from '@repo/schemas'

import {
  createProductFormSchema,
  editProductFormSchema,
} from '@/schemas/product'

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

  it('uses the shared message for a fixed discount equal to the price', () => {
    expect(
      messagesFor(
        { ...valid, discountType: DiscountType.FIXED, discountValue: 10 },
        'discountValue',
      ),
    ).toEqual([DISCOUNT_FIXED_MESSAGE])
  })
})

describe('editProductFormSchema', () => {
  const validEdit = {
    categoryId: 'category-1',
    name: 'Single Origin',
    description: 'Bright and floral',
    roastLevel: RoastLevel.LIGHT,
    isOrganic: false,
    isFairTrade: false,
    origin: 'Ethiopia',
    processingMethod: 'Washed',
    price: 120,
    discountType: DiscountType.PERCENT,
    discountValue: 10,
    quantity: 30,
  }

  function editMessagesFor(input: Record<string, unknown>, field: string) {
    const result = editProductFormSchema.safeParse(input)
    if (result.success) return []
    return result.error.issues
      .filter((issue) => issue.path[0] === field)
      .map((issue) => issue.message)
  }

  it('accepts a valid edit', () => {
    expect(editProductFormSchema.safeParse(validEdit).success).toBe(true)
  })

  it('rejects a percent discount of 100 with the shared message', () => {
    expect(
      editMessagesFor({ ...validEdit, discountValue: 100 }, 'discountValue'),
    ).toEqual([
      'DiscountValue must be less than 100 when DiscountType is PERCENT',
    ])
  })

  it('rejects a fixed discount equal to the price with the shared message', () => {
    expect(
      editMessagesFor(
        { ...validEdit, discountType: DiscountType.FIXED, discountValue: 120 },
        'discountValue',
      ),
    ).toEqual(['Fixed discount must be less than base price'])
  })

  it('rejects quantity -1 with the API min message', () => {
    expect(editMessagesFor({ ...validEdit, quantity: -1 }, 'quantity')).toEqual(
      ['Quantity must not be less than 0'],
    )
  })

  it('accepts a percent discount of 12.5', () => {
    expect(
      editProductFormSchema.safeParse({ ...validEdit, discountValue: 12.5 })
        .success,
    ).toBe(true)
  })
})
