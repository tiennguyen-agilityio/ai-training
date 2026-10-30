'use client'

import { toast } from 'sonner'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { ROUTES, dashboardEditPath } from '@/constants/routes'
import { useCategoryById, useUpdateCategory } from '@/hooks/useCategory'
import { CategoryForm } from '@/sections/CategoryForm'

const EditCategory = () => {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const rawId = params?.id
  const categoryId = Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? '')

  const { category, isLoading, isError, errorMessage } =
    useCategoryById(categoryId)
  const { mutate, isPending } = useUpdateCategory()

  const trimmedId = categoryId.trim()
  const editHref = trimmedId
    ? dashboardEditPath(ROUTES.DASHBOARD_CATEGORIES, trimmedId)
    : ROUTES.DASHBOARD_CATEGORIES

  if (!trimmedId) {
    return (
      <div className="flex flex-col gap-4 px-6 py-12">
        <p className="text-muted-foreground">Missing category id.</p>
        <Link
          href={ROUTES.DASHBOARD_CATEGORIES}
          className="w-fit text-primary underline"
        >
          Back to categories
        </Link>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4 px-6 py-12">
        <p className="text-destructive">
          {errorMessage ?? ERROR_MESSAGES.NETWORK_ERROR}
        </p>
        <Link
          href={ROUTES.DASHBOARD_CATEGORIES}
          className="w-fit text-primary underline"
        >
          Back to categories
        </Link>
      </div>
    )
  }

  return (
    <CategoryForm
      formId="edit-category-form"
      title="Edit Category"
      breadcrumbItems={[
        { label: 'Dashboard', href: ROUTES.DASHBOARD },
        { label: 'Categories', href: ROUTES.DASHBOARD_CATEGORIES },
        { label: 'Edit', href: editHref },
      ]}
      submitLabel="Save changes"
      defaultName={category?.name}
      isPending={isPending}
      isLoading={isLoading}
      requireChange
      onSubmit={(data, { handleServerError }) =>
        mutate(
          { id: trimmedId, body: data },
          {
            onSuccess: () => {
              toast.success(SUCCESS_MESSAGES.CATEGORY_UPDATED)
              router.push(ROUTES.DASHBOARD_CATEGORIES)
            },
            onError: handleServerError,
          },
        )
      }
    />
  )
}

export default EditCategory
