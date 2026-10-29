import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'

import { PageContent } from '@/app/dashboard/categories/PageContent'
import { DIALOG_MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import {
  useCategories,
  useDeleteCategory,
  useRestoreCategory,
} from '@/hooks/useCategory'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

jest.mock('@/hooks/useCategory', () => ({
  useCategories: jest.fn(),
  useDeleteCategory: jest.fn(),
  useRestoreCategory: jest.fn(),
}))

jest.mock('sonner', () => ({ toast: { success: jest.fn() } }))

const mockUsePathname = jest.mocked(usePathname)
const mockUseRouter = jest.mocked(useRouter)
const mockUseSearchParams = jest.mocked(useSearchParams)
const mockUseCategories = jest.mocked(useCategories)
const mockUseDeleteCategory = jest.mocked(useDeleteCategory)
const mockUseRestoreCategory = jest.mocked(useRestoreCategory)
const mockToastSuccess = jest.mocked(toast.success)

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
  const mutateRestore = jest.fn()

  beforeEach(() => {
    mutateDelete.mockReset()
    mutateRestore.mockReset()
    mockToastSuccess.mockReset()
    mockUseRestoreCategory.mockReturnValue({
      mutate: mutateRestore,
      isPending: false,
    } as unknown as ReturnType<typeof useRestoreCategory>)
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

  it('renders a deleted category with only the Restore action', () => {
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
    expect(
      screen.queryByRole('button', { name: /edit hello/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /edit hello/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /remove hello/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /restore hello/i }),
    ).toBeInTheDocument()
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

  it('delete dialog names the category without its slug', async () => {
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
    const dialog = await screen.findByTestId('modal-confirm-delete-category')
    expect(dialog).toHaveTextContent('This will remove Hello.')
    expect(dialog).not.toHaveTextContent('(hello)')
  })

  it('delete dialog description constant has no slug or Removed badge sentence', () => {
    expect(DIALOG_MESSAGES.CATEGORY.DELETE.DESCRIPTION('Hello')).toBe(
      'This will remove Hello.',
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

  describe('restore', () => {
    const restoreError = 'Only a deleted category can be restored.'

    beforeEach(() => {
      mockUseCategories.mockReturnValue({
        categories: [
          { ...listCategory, deletedAt: '2026-02-01T00:00:00.000Z' },
        ],
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
    })

    const openRestoreDialog = async (
      user: ReturnType<typeof userEvent.setup>,
    ) => {
      await user.click(screen.getByRole('button', { name: /restore hello/i }))
      await screen.findByText('Restore this category?')
    }

    it('opens the restore dialog with the restore texts', async () => {
      const user = userEvent.setup()
      render(<PageContent />)

      await openRestoreDialog(user)

      const dialog = screen.getByTestId('modal-confirm-restore-category')
      expect(dialog).toHaveTextContent('This will restore Hello.')
      expect(dialog).not.toHaveTextContent('(hello)')
      expect(
        screen.getByRole('button', { name: /^restore$/i }),
      ).toBeInTheDocument()
      expect(
        screen.queryByText('Remove this category?'),
      ).not.toBeInTheDocument()
    })

    it('calls restore mutate with the category id on confirm', async () => {
      const user = userEvent.setup()
      render(<PageContent />)

      await openRestoreDialog(user)
      await user.click(screen.getByRole('button', { name: /^restore$/i }))

      expect(mutateRestore).toHaveBeenCalledWith(
        'cat-list-1',
        expect.any(Object),
      )
    })

    it('closes the restore dialog and toasts on success', async () => {
      const user = userEvent.setup()
      mutateRestore.mockImplementation((_id, options) => {
        void Promise.resolve().then(() => {
          options?.onSuccess?.()
        })
      })
      render(<PageContent />)

      await openRestoreDialog(user)
      await user.click(screen.getByRole('button', { name: /^restore$/i }))

      await waitFor(() =>
        expect(
          screen.queryByText('Restore this category?'),
        ).not.toBeInTheDocument(),
      )
      expect(mockToastSuccess).toHaveBeenCalledWith('Category restored')
    })

    it('shows the restore API error in the dialog', async () => {
      const user = userEvent.setup()
      mutateRestore.mockImplementation((_id, options) => {
        void Promise.resolve().then(() => {
          options?.onError?.(new Error(restoreError))
        })
      })
      render(<PageContent />)

      await openRestoreDialog(user)
      await user.click(screen.getByRole('button', { name: /^restore$/i }))

      expect(await screen.findByText(restoreError)).toHaveAttribute(
        'role',
        'alert',
      )
      expect(screen.getByText('Restore this category?')).toBeInTheDocument()
      expect(mockToastSuccess).not.toHaveBeenCalled()
    })

    it('keeps the restore dialog open while the restore is pending', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<PageContent />)

      await openRestoreDialog(user)
      mockUseRestoreCategory.mockReturnValue({
        mutate: mutateRestore,
        isPending: true,
      } as unknown as ReturnType<typeof useRestoreCategory>)
      rerender(<PageContent />)
      await user.keyboard('{Escape}')

      expect(screen.getByText('Restore this category?')).toBeInTheDocument()
    })

    it('clears the restore error when the dialog is reopened', async () => {
      const user = userEvent.setup()
      mutateRestore.mockImplementation((_id, options) => {
        void Promise.resolve().then(() => {
          options?.onError?.(new Error(restoreError))
        })
      })
      render(<PageContent />)

      await openRestoreDialog(user)
      await user.click(screen.getByRole('button', { name: /^restore$/i }))
      await screen.findByText(restoreError)
      await user.click(screen.getByRole('button', { name: /^cancel$/i }))
      await waitFor(() =>
        expect(
          screen.queryByText('Restore this category?'),
        ).not.toBeInTheDocument(),
      )

      await openRestoreDialog(user)
      expect(screen.queryByText(restoreError)).not.toBeInTheDocument()
    })

    it('closes the restore dialog without calling mutate when Cancel', async () => {
      const user = userEvent.setup()
      render(<PageContent />)

      await openRestoreDialog(user)
      await user.click(screen.getByRole('button', { name: /^cancel$/i }))

      await waitFor(() =>
        expect(
          screen.queryByText('Restore this category?'),
        ).not.toBeInTheDocument(),
      )
      expect(mutateRestore).not.toHaveBeenCalled()
    })
  })
})
