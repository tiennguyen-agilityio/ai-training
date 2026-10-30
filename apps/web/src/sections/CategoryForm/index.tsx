'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

// Constants
import {
  createCategoryFormSchema,
  type CreateCategoryFormValues,
} from '@/schemas/category'

// Components
import { type BreadcrumbNavItem } from '@/components/Breadcrumb'
import { Input } from '@/components/Input'
import Loading from '@/components/Loading'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

// Utils
import { mapServerErrors, setServerFieldErrors } from '@/utils/form'

export interface CategoryFormActions {
  /** Name errors go under the input (focused), the rest to toasts. */
  handleServerError: (error: unknown) => void
  reset: (values?: CreateCategoryFormValues) => void
}

export interface CategoryFormProps {
  formId: string
  title: string
  breadcrumbItems: BreadcrumbNavItem[]
  submitLabel: string
  /** When defined and changed, the form is reset to it. */
  defaultName?: string
  isPending: boolean
  /** Shows the loading state instead of the input. */
  isLoading?: boolean
  /** Keeps submit disabled until the name differs from the last reset. */
  requireChange?: boolean
  onSubmit: (
    values: CreateCategoryFormValues,
    actions: CategoryFormActions,
  ) => void
}

export const CategoryForm = ({
  formId,
  title,
  breadcrumbItems,
  submitLabel,
  defaultName,
  isPending,
  isLoading = false,
  requireChange = false,
  onSubmit,
}: CategoryFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: { name: defaultName ?? '' },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  useEffect(() => {
    if (defaultName === undefined) return
    reset({ name: defaultName })
  }, [defaultName, reset])

  const handleServerError = (error: unknown) => {
    const { fieldErrors, unmatched } = mapServerErrors(error, (field) =>
      field === 'name' ? 'name' : undefined,
    )
    setServerFieldErrors(setError, fieldErrors, setFocus)
    unmatched.forEach((message) => toast.error(message))
  }

  const formDisabled = isPending || isLoading
  const submitDisabled = formDisabled || (requireChange && !isDirty)

  return (
    <form
      id={formId}
      className="flex flex-col gap-6"
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit(values, { handleServerError, reset }),
      )}
    >
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        title={title}
        actions={
          <Button
            type="submit"
            className="rounded-full px-8"
            disabled={submitDisabled}
            loading={isPending}
          >
            {submitLabel}
          </Button>
        }
      />

      <section className="overflow-hidden rounded-3xl border border-outline-variant/40 bg-card p-6 md:p-8">
        {isLoading ? (
          <Loading label="Loading category" className="px-0 py-0" />
        ) : (
          <Input
            id="category-name"
            label="Category name"
            type="text"
            autoComplete="off"
            placeholder="Enter category name"
            disabled={formDisabled}
            errorMessage={errors.name?.message}
            className="mt-2"
            {...register('name', {
              onChange: () => clearErrors('name'),
            })}
          />
        )}
      </section>
    </form>
  )
}
