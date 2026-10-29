import type { ReactElement } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'

import AddCategoryPage from './page'
import { ROUTES } from '@/constants/routes'
import type { Category } from '@/types/category'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

const mockUsePathname = jest.mocked(usePathname)

const apiErrorResponse = (field: string, message: string) => ({
  ok: false,
  status: 409,
  json: async () => ({
    statusCode: 409,
    message: 'Conflict',
    errors: [{ errCode: 'CATEGORY_NAME_EXISTS', field, message }],
  }),
})

const mockCategory: Category = {
  id: 'new-cat-1',
  name: 'Test Cat',
  slug: 'test-cat',
  createdBy: null,
  updatedBy: null,
  deletedBy: null,
  createdAt: null,
  updatedAt: null,
  deletedAt: null,
}

function renderWithQueryClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('AddCategoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePathname.mockReturnValue(ROUTES.DASHBOARD_CATEGORIES_ADD)
    global.fetch = jest.fn()
  })

  it('renders form heading and category name input', () => {
    renderWithQueryClient(<AddCategoryPage />)
    expect(
      screen.getByRole('heading', { name: 'Add Category' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: /category name/i }),
    ).toBeInTheDocument()
  })

  it('includes breadcrumb links to dashboard and categories', () => {
    renderWithQueryClient(<AddCategoryPage />)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      ROUTES.DASHBOARD,
    )
    expect(screen.getByRole('link', { name: 'Categories' })).toHaveAttribute(
      'href',
      ROUTES.DASHBOARD_CATEGORIES,
    )
  })

  it('shows validation error when name is empty', async () => {
    const { container } = renderWithQueryClient(<AddCategoryPage />)
    const form = container.querySelector('form')
    if (!form) throw new Error('expected form')
    fireEvent.submit(form)
    expect(
      await screen.findByText(/this field is required/i),
    ).toBeInTheDocument()
  })

  it('submits valid form and navigates to list after success', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockCategory }),
    })

    renderWithQueryClient(<AddCategoryPage />)
    await user.type(
      screen.getByRole('textbox', { name: /category name/i }),
      'Test Cat',
    )
    await user.click(screen.getByRole('button', { name: /create category/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/categories'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test Cat' }),
        }),
      )
    })
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(ROUTES.DASHBOARD_CATEGORIES)
    })
  })

  it('shows a duplicate-name API error under Category name', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue(
      apiErrorResponse('name', 'Category name already exists'),
    )

    renderWithQueryClient(<AddCategoryPage />)
    const input = screen.getByRole('textbox', { name: /category name/i })
    await user.type(input, 'Test Cat')
    await user.click(screen.getByRole('button', { name: /create category/i }))

    expect(
      await screen.findByText('Category name already exists'),
    ).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows a non-name API error as a toast, not under Name', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue(
      apiErrorResponse('', 'Something failed'),
    )

    renderWithQueryClient(<AddCategoryPage />)
    await user.type(
      screen.getByRole('textbox', { name: /category name/i }),
      'Test Cat',
    )
    await user.click(screen.getByRole('button', { name: /create category/i }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Something failed'),
    )
    expect(screen.queryByText('Something failed')).not.toBeInTheDocument()
  })
})
