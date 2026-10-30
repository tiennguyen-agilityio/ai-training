import { DiscountType, ProductUnit, RoastLevel } from '@repo/constants'

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

  it('rejects an initial quantity above 500', () => {
    expect(messagesFor({ ...valid, quantity: 501 }, 'quantity')).toContain(
      'Quantity must be at most 500',
    )
  })

  it('uses the screen label and a friendly max message for Base price', () => {
    expect(messagesFor({ ...valid, price: 100000000 }, 'price')).toContain(
      'Base price must be at most 99,999,999.99',
    )
  })

  it('uses a friendly min message for Weight', () => {
    expect(messagesFor({ ...valid, weight: 0 }, 'weight')).toContain(
      'Weight must be at least 1',
    )
  })

  it('uses the screen label for the Discount max message', () => {
    expect(
      messagesFor(
        {
          ...valid,
          discountType: DiscountType.FIXED,
          discountValue: 100000000,
        },
        'discountValue',
      ),
    ).toContain('Discount must be at most 99,999,999.99')
  })

  it('uses a friendly message for a percent discount of 100', () => {
    expect(
      messagesFor(
        { ...valid, discountType: DiscountType.PERCENT, discountValue: 100 },
        'discountValue',
      ),
    ).toEqual(['Discount must be less than 100%'])
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

  it('uses a friendly message for a fixed discount equal to the price', () => {
    expect(
      messagesFor(
        { ...valid, discountType: DiscountType.FIXED, discountValue: 10 },
        'discountValue',
      ),
    ).toEqual(['Discount must be less than the base price'])
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

  it('rejects a percent discount of 100 with a friendly message', () => {
    expect(
      editMessagesFor({ ...validEdit, discountValue: 100 }, 'discountValue'),
    ).toEqual(['Discount must be less than 100%'])
  })

  it('rejects a fixed discount equal to the price with a friendly message', () => {
    expect(
      editMessagesFor(
        { ...validEdit, discountType: DiscountType.FIXED, discountValue: 120 },
        'discountValue',
      ),
    ).toEqual(['Discount must be less than the base price'])
  })

  it('rejects quantity -1 with a friendly min message', () => {
    expect(editMessagesFor({ ...validEdit, quantity: -1 }, 'quantity')).toEqual(
      ['Quantity must be at least 0'],
    )
  })

  it('accepts a quantity above 500, since the API has no maximum', () => {
    expect(
      editProductFormSchema.safeParse({ ...validEdit, quantity: 501 }).success,
    ).toBe(true)
  })

  it('accepts a percent discount of 12.5', () => {
    expect(
      editProductFormSchema.safeParse({ ...validEdit, discountValue: 12.5 })
        .success,
    ).toBe(true)
  })
})
