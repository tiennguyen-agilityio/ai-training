import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PageContent } from '@/app/dashboard/categories/PageContent'
import { DIALOG_MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import { useCategories, useDeleteCategory } from '@/hooks/useCategory'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

jest.mock('@/hooks/useCategory', () => ({
  useCategories: jest.fn(),
  useDeleteCategory: jest.fn(),
}))

const mockUsePathname = jest.mocked(usePathname)
const mockUseRouter = jest.mocked(useRouter)
const mockUseSearchParams = jest.mocked(useSearchParams)
const mockUseCategories = jest.mocked(useCategories)
const mockUseDeleteCategory = jest.mocked(useDeleteCategory)

const listCategory = {
  id: 'cat-list-1',
  name: 'Hello',
  slug: 'hello',
  createdBy: null,
  updatedBy: null,
  deletedBy: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
}

describe('Categories PageContent', () => {
  const mutateDelete = jest.fn()

  beforeEach(() => {
    mutateDelete.mockReset()
    mockUsePathname.mockReturnValue(ROUTES.DASHBOARD_CATEGORIES)
    mockUseRouter.mockReturnValue({
      replace: jest.fn(),
    } as unknown as ReturnType<typeof useRouter>)
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('') as ReturnType<typeof useSearchParams>,
    )
    mockUseCategories.mockReturnValue({
      categories: [],
      meta: {
        limit: 10,
        currentPage: 1,
        pageCount: 1,
        totalCount: 0,
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      errorMessage: null,
      refetch: jest.fn(),
    })
    mockUseDeleteCategory.mockReturnValue({
      mutate: mutateDelete,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteCategory>)
  })

  it('Add category navigates to add route', () => {
    render(<PageContent />)

    expect(screen.getByRole('link', { name: /add category/i })).toHaveAttribute(
      'href',
      ROUTES.DASHBOARD_CATEGORIES_ADD,
    )
  })

  it('requests the list with deleted categories', () => {
    render(<PageContent />)

    expect(mockUseCategories).toHaveBeenCalledWith(
      expect.objectContaining({ includeDeleted: true }),
    )
  })

  it('renders a deleted category with Edit and Remove disabled', () => {
    mockUseCategories.mockReturnValue({
      categories: [{ ...listCategory, deletedAt: '2026-02-01T00:00:00.000Z' }],
      meta: {
        limit: 10,
        currentPage: 1,
        pageCount: 1,
        totalCount: 1,
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      errorMessage: null,
      refetch: jest.fn(),
    })

    render(<PageContent />)

    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit hello/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /remove hello/i })).toBeDisabled()
  })

  it('delete dialog does not mention a Removed badge', async () => {
    const user = userEvent.setup()
    mockUseCategories.mockReturnValue({
      categories: [listCategory],
      meta: {
        limit: 10,
        currentPage: 1,
        pageCount: 1,
        totalCount: 1,
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      errorMessage: null,
      refetch: jest.fn(),
    })

    render(<PageContent />)

    await user.click(screen.getByRole('button', { name: /remove hello/i }))
    expect(await screen.findByText('Remove this category?')).toBeInTheDocument()
    expect(screen.queryByText(/removed badge/i)).not.toBeInTheDocument()
  })

  it('delete dialog description constant has no Removed badge sentence', () => {
    expect(DIALOG_MESSAGES.CATEGORY.DELETE.DESCRIPTION('Hello', 'hello')).toBe(
      'This will remove Hello (hello).',
    )
  })

  it('opens remove dialog and calls mutate on confirm', async () => {
    const user = userEvent.setup()
    mockUseCategories.mockReturnValue({
      categories: [listCategory],
      meta: {
        limit: 10,
        currentPage: 1,
        pageCount: 1,
        totalCount: 1,
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      errorMessage: null,
      refetch: jest.fn(),
    })

    render(<PageContent />)

    await user.click(screen.getByRole('button', { name: /remove hello/i }))
    expect(await screen.findByText('Remove this category?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(mutateDelete).toHaveBeenCalledWith('cat-list-1', expect.any(Object))
  })

  it('closes remove dialog without calling mutate when Cancel', async () => {
    const user = userEvent.setup()
    mockUseCategories.mockReturnValue({
      categories: [listCategory],
      meta: {
        limit: 10,
        currentPage: 1,
        pageCount: 1,
        totalCount: 1,
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      errorMessage: null,
      refetch: jest.fn(),
    })

    render(<PageContent />)

    await user.click(screen.getByRole('button', { name: /remove hello/i }))
    await screen.findByText('Remove this category?')

    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(mutateDelete).not.toHaveBeenCalled()
  })

  it('shows delete API error in the dialog instead of only toast', async () => {
    const user = userEvent.setup()
    mockUseCategories.mockReturnValue({
      categories: [listCategory],
      meta: {
        limit: 10,
        currentPage: 1,
        pageCount: 1,
        totalCount: 1,
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      errorMessage: null,
      refetch: jest.fn(),
    })
    mutateDelete.mockImplementation((_id, options) => {
      void Promise.resolve().then(() => {
        options?.onError?.(new Error('Category in use'))
      })
    })

    render(<PageContent />)

    await user.click(screen.getByRole('button', { name: /remove hello/i }))
    await screen.findByText('Remove this category?')
    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    expect(await screen.findByText('Category in use')).toHaveAttribute(
      'role',
      'alert',
    )
  })
})
