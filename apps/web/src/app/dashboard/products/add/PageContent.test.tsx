import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductUnit } from '@repo/constants'
import { toast } from 'sonner'

import PageContent from './PageContent'
import { useCategories } from '@/hooks/useCategory'
import { useCreateProduct } from '@/hooks/useProduct'
import { uploadImageToImgBB } from '@/services/image'
import type { Category } from '@/types/category'
import { ServiceError } from '@/utils/query'

const mockMutate = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/products/add',
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/hooks/useProduct', () => ({
  useCreateProduct: jest.fn(),
}))

jest.mock('@/hooks/useCategory', () => ({
  useCategories: jest.fn(),
}))

jest.mock('@/services/image', () => ({
  uploadImageToImgBB: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('@/components/Select', () => ({
  Select: ({
    label,
    selected,
    onValueChange,
    options,
  }: {
    label?: string
    selected?: string
    onValueChange?: (value: string) => void
    options: { value: string; label: string }[]
  }) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={selected ?? ''}
        onChange={(event) => onValueChange?.(event.target.value)}
      >
        <option value="">-</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}))

interface MutateOptions {
  onError?: (error: unknown) => void
}

const category: Category = {
  id: 'cat-1',
  name: 'Espresso',
  slug: 'espresso',
  createdBy: null,
  updatedBy: null,
  deletedBy: null,
  createdAt: null,
  updatedAt: null,
  deletedAt: null,
}

const image = (name: string) => new File(['x'], name, { type: 'image/png' })

const submitValidForm = async (
  beforeSubmit?: (user: ReturnType<typeof userEvent.setup>) => Promise<void>,
) => {
  const user = userEvent.setup()
  const { container } = render(<PageContent />)

  const avatarInput = container.querySelector('input[name="avatar"]')
  const galleryInput = container.querySelector('input[name^="gallery"]')
  if (!(avatarInput instanceof HTMLInputElement)) throw new Error('avatar')
  if (!(galleryInput instanceof HTMLInputElement)) throw new Error('gallery')
  await user.upload(avatarInput, image('avatar.png'))
  await user.upload(galleryInput, image('gallery.png'))

  const fill = async (label: string, value: string) => {
    await user.click(screen.getByLabelText(label))
    await user.paste(value)
  }
  await fill('Product Name', 'Single Origin')
  await fill('Description', 'Bright and floral')
  await user.selectOptions(screen.getByLabelText('Category'), 'cat-1')
  await fill('Weight', '250')
  await user.selectOptions(screen.getByLabelText('Unit'), ProductUnit.G)
  await fill('Base Price', '20')
  await fill('Initial Quantity', '5')
  await fill('Origin', 'Ethiopia')
  await fill('Processing Method', 'Washed')
  await beforeSubmit?.(user)

  await user.click(screen.getByRole('button', { name: /publish product/i }))
  await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1))
}

const failWith = (field: string, message: string) => {
  const [, options] = mockMutate.mock.calls[0] as [unknown, MutateOptions]
  act(() =>
    options.onError?.(
      new ServiceError(message, [{ errCode: 'E', field, message }]),
    ),
  )
}

// Each test renders the whole Add form and submits it; under a parallel
// pre-push run that can pass Jest's 5 s default.
jest.setTimeout(15_000)

describe('Add product API errors', () => {
  beforeAll(() => {
    URL.createObjectURL = jest.fn(() => 'blob:preview')
    URL.revokeObjectURL = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useCreateProduct).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateProduct>)
    jest.mocked(useCategories).mockReturnValue({
      categories: [category],
      isLoading: false,
    } as unknown as ReturnType<typeof useCategories>)
    jest.mocked(uploadImageToImgBB).mockImplementation(async (file: File) => ({
      ok: true,
      url: `https://img.example.com/${file.name}`,
    }))
  })

  it('shows a duplicate-name API error under Product name', async () => {
    await submitValidForm()

    failWith('name', 'Product name already exists')

    expect(
      await screen.findByText('Product name already exists'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Product Name')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows an API variant price error under Base Price', async () => {
    await submitValidForm()

    failWith('variants.0.price', 'Price must not be greater than 99999999.99')

    expect(
      await screen.findByText('Price must not be greater than 99999999.99'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Base Price')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('shows a duplicate-SKU API error under Weight', async () => {
    await submitValidForm()

    failWith(
      'sku',
      'A variant with this SKU already exists. Please choose a different SKU.',
    )

    expect(
      await screen.findByText(
        'A variant with this SKU already exists. Please choose a different SKU.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Weight')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('shows an API images error in the Gallery box', async () => {
    await submitValidForm()

    failWith('images', 'Too big: expected array to have <=10 items')

    expect(
      await screen.findByText('Too big: expected array to have <=10 items'),
    ).toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows an unmatched API error as a toast', async () => {
    await submitValidForm()

    failWith('', 'Product must have exactly one primary image')

    expect(toast.error).toHaveBeenCalledWith(
      'Product must have exactly one primary image',
    )
  })

  it('accepts a 12.5 percent discount', async () => {
    await submitValidForm(async (user) => {
      await user.clear(screen.getByLabelText('Discount (%)'))
      await user.type(screen.getByLabelText('Discount (%)'), '12.5')
    })

    const [payload] = mockMutate.mock.calls[0] as [
      { variants: { discountValue: number }[] },
    ]
    expect(payload.variants[0]?.discountValue).toBe(12.5)
  })

  it('does not accept a quantity above 500', async () => {
    const user = userEvent.setup()
    render(<PageContent />)

    await user.type(screen.getByLabelText('Initial Quantity'), '501')

    expect(screen.getByLabelText('Initial Quantity')).toHaveValue('50')
  })
})
