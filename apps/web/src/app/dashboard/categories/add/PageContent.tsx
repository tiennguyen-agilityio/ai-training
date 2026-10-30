'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Constants
import { SUCCESS_MESSAGES } from '@/constants/messages'
import { ROUTES } from '@/constants/routes'

// Hooks
import { useCreateCategory } from '@/hooks/useCategory'

// Components
import { CategoryForm } from '@/sections/CategoryForm'

const PageContent = () => {
  const router = useRouter()
  const { mutate, isPending } = useCreateCategory()

  return (
    <CategoryForm
      formId="create-category-form"
      title="Add Category"
      breadcrumbItems={[
        { label: 'Dashboard', href: ROUTES.DASHBOARD },
        { label: 'Categories', href: ROUTES.DASHBOARD_CATEGORIES },
        { label: 'Add', href: ROUTES.DASHBOARD_CATEGORIES_ADD },
      ]}
      submitLabel="Create category"
      isPending={isPending}
      onSubmit={(data, { handleServerError, reset }) =>
        mutate(data, {
          onSuccess: () => {
            toast.success(SUCCESS_MESSAGES.CATEGORY_CREATED)
            reset({ name: '' })
            router.push(ROUTES.DASHBOARD_CATEGORIES)
          },
          onError: handleServerError,
        })
      }
    />
  )
}

export default PageContent
