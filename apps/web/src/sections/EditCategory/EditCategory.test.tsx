import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'

import EditCategory from '.'
import { ROUTES } from '@/constants/routes'
import { useCategoryById, useUpdateCategory } from '@/hooks/useCategory'
import type { Category } from '@/types/category'
import { ServiceError } from '@/utils/query'

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'cat-1' }),
  usePathname: () => '/dashboard/categories/cat-1/edit',
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/hooks/useCategory', () => ({
  useCategoryById: jest.fn(),
  useUpdateCategory: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
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

const mockMutate = jest.fn()

const submitRenamed = async () => {
  const user = userEvent.setup()
  render(<EditCategory />)
  const input = screen.getByRole('textbox', { name: /category name/i })
  await user.clear(input)
  await user.type(input, 'Filter')
  await user.click(screen.getByRole('button', { name: /save changes/i }))
  await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1))
  return input
}

const failWith = (error: unknown) => {
  const [, options] = mockMutate.mock.calls[0] as [unknown, MutateOptions]
  act(() => options.onError?.(error))
}

describe('EditCategory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useCategoryById).mockReturnValue({
      category,
      isLoading: false,
      isError: false,
      errorMessage: null,
      refetch: jest.fn(),
    })
    jest.mocked(useUpdateCategory).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>)
  })

  it('keeps Save changes disabled until the name changes', async () => {
    const user = userEvent.setup()
    render(<EditCategory />)
    const save = screen.getByRole('button', { name: /save changes/i })
    const input = screen.getByRole('textbox', { name: /category name/i })

    expect(save).toBeDisabled()

    await user.type(input, 'X')
    expect(save).toBeEnabled()

    await user.type(input, '{backspace}')
    expect(save).toBeDisabled()
  })

  it('shows the load error with a link back to categories', () => {
    jest.mocked(useCategoryById).mockReturnValue({
      category: null,
      isLoading: false,
      isError: true,
      errorMessage: 'Not found',
      refetch: jest.fn(),
    })

    render(<EditCategory />)

    expect(screen.getByText('Not found')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /back to categories/i }),
    ).toHaveAttribute('href', ROUTES.DASHBOARD_CATEGORIES)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})

describe('EditCategory API errors', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useCategoryById).mockReturnValue({
      category,
      isLoading: false,
      isError: false,
      errorMessage: null,
      refetch: jest.fn(),
    })
    jest.mocked(useUpdateCategory).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>)
  })

  it('shows a duplicate-name API error under Category name', async () => {
    const input = await submitRenamed()

    failWith(
      new ServiceError('Conflict', [
        {
          errCode: 'CATEGORY_NAME_EXISTS',
          field: 'name',
          message: 'Category name already exists',
        },
      ]),
    )

    expect(
      await screen.findByText('Category name already exists'),
    ).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows a non-name API error as a toast, not under Name', async () => {
    await submitRenamed()

    failWith(
      new ServiceError('Bad Request', [
        { errCode: 'E', field: '', message: 'Something failed' },
      ]),
    )

    expect(toast.error).toHaveBeenCalledWith('Something failed')
    expect(screen.queryByText('Something failed')).not.toBeInTheDocument()
  })
})
