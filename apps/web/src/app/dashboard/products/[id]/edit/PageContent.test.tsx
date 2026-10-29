import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  DiscountType,
  ProductStatus,
  ProductUnit,
  RoastLevel,
} from '@repo/constants'
import type { UpdateProductPayload } from '@repo/schemas'
import { toast } from 'sonner'

import PageContent from './PageContent'
import { ROUTES } from '@/constants/routes'
import { useCategories } from '@/hooks/useCategory'
import { useProductById, useUpdateProduct } from '@/hooks/useProduct'
import type { Product, ProductVariantSummary } from '@/types/product'
import { ServiceError } from '@/utils/query'

const mockPush = jest.fn()
const mockMutate = jest.fn()

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'product-1' }),
  usePathname: () => '/dashboard/products/product-1/edit',
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/hooks/useProduct', () => ({
  useProductById: jest.fn(),
  useUpdateProduct: jest.fn(),
}))

jest.mock('@/hooks/useCategory', () => ({
  useCategories: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

interface MutateOptions {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

const variant = (
  overrides: Partial<ProductVariantSummary> = {},
): ProductVariantSummary => ({
  id: 'variant-a',
  sku: 'SKU-A',
  weight: 250,
  unit: ProductUnit.G,
  price: 100,
  discountType: DiscountType.PERCENT,
  discountValue: 10,
  quantity: 30,
  ...overrides,
})

const product = (
  variantOverrides: Partial<ProductVariantSummary> = {},
): Product => ({
  id: 'product-1',
  categoryId: 'category-1',
  name: 'Single Origin',
  description: 'Bright and floral',
  roastLevel: RoastLevel.LIGHT,
  isOrganic: false,
  isFairTrade: false,
  status: ProductStatus.ACTIVE,
  tastingNotes: '',
  origin: 'Ethiopia',
  processingMethod: 'Washed',
  variants: [
    variant(variantOverrides),
    variant({ id: 'variant-b', price: 999 }),
  ],
  images: [
    {
      id: 'image-1',
      url: 'https://example.com/1.jpg',
      isPrimary: true,
      sortOrder: 0,
    },
    {
      id: 'image-2',
      url: 'https://example.com/2.jpg',
      isPrimary: false,
      sortOrder: 1,
    },
  ],
  createdAt: null,
  updatedAt: null,
})

function renderPage(variantOverrides: Partial<ProductVariantSummary> = {}) {
  jest.mocked(useProductById).mockReturnValue({
    product: product(variantOverrides),
    isLoading: false,
    isError: false,
    errorMessage: null,
    refetch: jest.fn(),
  })
  return render(<PageContent />)
}

const sentBody = (): UpdateProductPayload =>
  (mockMutate.mock.calls[0][0] as { body: UpdateProductPayload }).body

const field = (label: string | RegExp) => screen.getByLabelText(label)

async function replaceValue(label: string | RegExp, value: string) {
  const input = field(label)
  await userEvent.clear(input)
  await userEvent.type(input, value)
}

const save = () =>
  userEvent.click(screen.getByRole('button', { name: /save changes/i }))

describe('EditProductForm pricing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useCategories).mockReturnValue({
      categories: [{ id: 'category-1', name: 'Coffee' }],
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>)
    jest.mocked(useUpdateProduct).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProduct>)
  })

  it('prefills Base Price, Percent, Discount (%) and Quantity', () => {
    renderPage()

    expect(field('Base Price')).toHaveValue('100')
    expect(field('Discount (%)')).toHaveValue('10')
    expect(field('Quantity')).toHaveValue('30')
    expect(screen.getByRole('button', { name: 'Percent' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('sends the changed Base Price in updateVariants and returns to the list', async () => {
    mockMutate.mockImplementation((_input, options: MutateOptions) =>
      options.onSuccess?.(),
    )
    renderPage()

    await replaceValue('Base Price', '120')
    await save()

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1))
    expect(sentBody().updateVariants).toEqual([
      {
        id: 'variant-a',
        price: 120,
        discountType: DiscountType.PERCENT,
        discountValue: 10,
        quantity: 30,
      },
    ])
    expect(mockPush).toHaveBeenCalledWith(ROUTES.DASHBOARD_PRODUCTS)
  })

  it('sends PERCENT 0 when Discount (%) is 0', async () => {
    renderPage()

    await replaceValue('Discount (%)', '0')
    await save()

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1))
    expect(sentBody().updateVariants?.[0]).toMatchObject({
      discountType: DiscountType.PERCENT,
      discountValue: 0,
    })
  })

  it('prefills Discount (%) 12.5 and sends it unchanged', async () => {
    renderPage({ discountValue: 12.5 })

    expect(field('Discount (%)')).toHaveValue('12.5')
    await replaceValue('Quantity', '31')
    await save()

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1))
    expect(sentBody().updateVariants?.[0].discountValue).toBe(12.5)
  })

  it('truncates Discount (%) 12.345 to 12.34', async () => {
    renderPage()

    await replaceValue('Discount (%)', '12.345')

    expect(field('Discount (%)')).toHaveValue('12.34')
  })

  it('blocks a percent discount of 100 without sending', async () => {
    renderPage()

    await replaceValue('Discount (%)', '100')
    await save()

    expect(
      await screen.findByText(
        'DiscountValue must be less than 100 when DiscountType is PERCENT',
      ),
    ).toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('blocks a fixed discount equal to the price without sending', async () => {
    renderPage()

    await replaceValue('Base Price', '120')
    await userEvent.click(screen.getByRole('button', { name: 'Fixed' }))
    await replaceValue('Discount Amount', '120')
    await save()

    expect(
      await screen.findByText('Fixed discount must be less than base price'),
    ).toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows an API discount error on the Discount field', async () => {
    mockMutate.mockImplementation((_input, options: MutateOptions) =>
      options.onError?.(
        new ServiceError('Fixed discount must be less than base price', [
          {
            errCode: 'maxFixedDiscountValue',
            field: 'updateVariants.0.discountValue',
            message: 'Fixed discount must be less than base price',
          },
        ]),
      ),
    )
    renderPage()

    await replaceValue('Quantity', '50')
    await save()

    expect(
      await screen.findByText('Fixed discount must be less than base price'),
    ).toBeInTheDocument()
    expect(field('Discount (%)')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a variant error and a name error from the same response', async () => {
    mockMutate.mockImplementation((_input, options: MutateOptions) =>
      options.onError?.(
        new ServiceError('Fixed discount must be less than base price', [
          {
            errCode: 'maxFixedDiscountValue',
            field: 'updateVariants.0.discountValue',
            message: 'Fixed discount must be less than base price',
          },
          {
            errCode: 'productNameExists',
            field: 'name',
            message: 'Product name already exists',
          },
        ]),
      ),
    )
    renderPage()

    await replaceValue('Quantity', '50')
    await save()

    expect(
      await screen.findByText('Fixed discount must be less than base price'),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Product name already exists'),
    ).toBeInTheDocument()
    expect(field('Product Name')).toHaveAttribute('aria-invalid', 'true')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows an unmatched API error as a toast next to the field errors', async () => {
    mockMutate.mockImplementation((_input, options: MutateOptions) =>
      options.onError?.(
        new ServiceError('Price must not be less than 1', [
          {
            errCode: 'min',
            field: 'updateVariants.0.price',
            message: 'Price must not be less than 1',
          },
          {
            errCode: 'tooManyImages',
            field: '',
            message: 'A product can have at most 10 images',
          },
        ]),
      ),
    )
    renderPage()

    await replaceValue('Quantity', '50')
    await save()

    expect(
      await screen.findByText('Price must not be less than 1'),
    ).toBeInTheDocument()
    expect(toast.error).toHaveBeenCalledWith(
      'A product can have at most 10 images',
    )
  })
})
