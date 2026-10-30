'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Printer, Tag } from 'lucide-react'

// Constants
import { SUCCESS_MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'
import { CATEGORIES_TABLE_COLUMNS } from '@/constants/category'

// Hooks
import {
  useCategories,
  useDeleteCategory,
  useRestoreCategory,
} from '@/hooks/useCategory'
import { useUrlState } from '@/hooks/useUrlState'
import { useDebouncedUrlSearch } from '@/hooks/useDebouncedUrlSearch'
import { usePageClamp } from '@/hooks/usePageClamp'

// Components
import ConfirmActionDialog from '@/components/ConfirmActionDialog'
import Breadcrumb from '@/components/Breadcrumb'
import Table from '@/components/Table'
import { PaginationBar } from '@/components/Pagination'
import { SearchInput } from '@/components/SearchInput'
import { Button, buttonVariants } from '@/components/ui/button'
import { CategoryTableRow } from '@/sections/CategoryTableRow'

// Types
import type { Category } from '@/types/category'

// Utils
import { urlSchema } from '@/utils/url'
import { cn } from '@/utils/styles'
import ListBody from '@/components/ListBody'

interface PendingCategoryAction {
  id: string
  name: string
}

const toPendingCategoryAction = (
  category: Category,
): PendingCategoryAction => ({
  id: category.id,
  name: category.name?.trim() ? category.name : '—',
})

export const PageContent = () => {
  const { state, update: updateUrl } = useUrlState(urlSchema)
  const { page, search, limit } = state
  const [pendingDelete, setPendingDelete] =
    useState<PendingCategoryAction | null>(null)
  const { mutate: deleteCategoryMutate, isPending: isDeletePending } =
    useDeleteCategory()
  const [pendingRestore, setPendingRestore] =
    useState<PendingCategoryAction | null>(null)
  const { mutate: restoreCategoryMutate, isPending: isRestorePending } =
    useRestoreCategory()
  const { searchInput, setSearchInput, searchInputRef } = useDebouncedUrlSearch(
    search,
    updateUrl,
  )

  const { categories, meta, isLoading, isFetching, isError, errorMessage } =
    useCategories({
      page,
      limit,
      search: search.trim(),
      includeDeleted: true,
    })

  const totalPages = Math.max(1, meta?.pageCount ?? 1)
  const totalCount = meta?.totalCount ?? categories.length
  const showingCount = categories.length

  usePageClamp({ meta, page, totalPages, updateUrl })

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value)
  }

  return (
    <div className="flex flex-col gap-6">
      <ConfirmActionDialog
        data-testid="modal-confirm-delete-category"
        item={pendingDelete}
        onClose={() => setPendingDelete(null)}
        mutate={deleteCategoryMutate}
        isPending={isDeletePending}
        successMessage={SUCCESS_MESSAGES.CATEGORY_DELETED}
        title="Remove this category?"
        renderDescription={(category) => (
          <p>
            This will remove <b>{category?.name}</b>.
          </p>
        )}
        textAction="Delete"
      />

      <ConfirmActionDialog
        data-testid="modal-confirm-restore-category"
        item={pendingRestore}
        onClose={() => setPendingRestore(null)}
        mutate={restoreCategoryMutate}
        isPending={isRestorePending}
        successMessage={SUCCESS_MESSAGES.CATEGORY_RESTORED}
        title="Restore this category?"
        renderDescription={(category) => (
          <p>
            This will restore <b>{category?.name}</b>.
          </p>
        )}
        textAction="Restore"
        actionVariant="default"
      />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: ROUTES.DASHBOARD },
              { label: 'Categories', href: ROUTES.DASHBOARD_CATEGORIES },
            ]}
          />
          <div className="space-y-2">
            <h1 className="text-5xl leading-tight font-bold tracking-tight text-foreground">
              Manage Categories
            </h1>
            <p className="text-lg text-muted-foreground">
              Organize product taxonomy, and editorial groupings.
            </p>
          </div>
        </div>
        <div className="flex w-full justify-end sm:w-auto">
          <Link
            href={ROUTES.DASHBOARD_CATEGORIES_ADD}
            className={cn(
              buttonVariants({ variant: 'default', size: 'default' }),
              'inline-flex w-full gap-2 px-8 sm:w-auto',
            )}
          >
            <Tag className="size-4" aria-hidden />
            Add category
          </Link>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-outline-variant/40 bg-card">
        <div className="flex min-w-0 flex-col gap-3 border-b border-outline-variant/30 p-4 md:flex-row md:flex-wrap md:items-center md:gap-3 lg:justify-between">
          <SearchInput
            ref={searchInputRef}
            value={searchInput}
            onChange={handleQueryChange}
            placeholder="Filter by name or slug..."
            aria-label="Filter categories by name or slug"
            containerClassName="h-12 bg-surface-container-high w-full md:w-auto md:min-w-0 md:max-w-md md:flex-1"
          />
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
            <Button
              disabled
              variant="outline"
              size="icon"
              aria-label="Export categories list"
              className="size-11"
            >
              <Download className="size-4" aria-hidden />
            </Button>
            <Button
              disabled
              variant="outline"
              size="icon"
              aria-label="Print categories list"
              className="size-11"
            >
              <Printer className="size-4" aria-hidden />
            </Button>
          </div>
        </div>

        <ListBody
          isLoading={isLoading}
          isError={isError}
          errorMessage={errorMessage}
          isFetching={isFetching}
        >
          <Table
            columns={CATEGORIES_TABLE_COLUMNS}
            isStackedOnMobile
            data={categories}
            getRowKey={(row, index) => row.id ?? `category-${index}`}
            resolveRowClassName={(row) =>
              row.deletedAt
                ? 'border-b border-border bg-muted-foreground/20'
                : ''
            }
            renderRow={(row) => (
              <CategoryTableRow
                category={row}
                onRequestDelete={(c) => {
                  setPendingDelete(toPendingCategoryAction(c))
                }}
                onRequestRestore={(c) => {
                  setPendingRestore(toPendingCategoryAction(c))
                }}
              />
            )}
            emptyMessage="No categories match your filters."
          />
        </ListBody>

        <footer className="border-t border-outline-variant/30 px-6 py-4">
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(next) => updateUrl({ page: next })}
            showingCount={showingCount}
            totalCount={totalCount}
            entityLabel="categories"
          />
        </footer>
      </section>
    </div>
  )
}
