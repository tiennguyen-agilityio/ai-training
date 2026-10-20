'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'

import AlertDialog from '@/components/AlertDialog'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { useAuth } from '@/hooks/useAuth'
import { updateProfileSchema, type UpdateProfileValues } from '@/schemas/user'
import { useUserStore } from '@/store/useUserStore'

interface EditProfileFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getErrorMessage(error: unknown): string {
  if (isClerkAPIResponseError(error)) {
    return (
      error.errors[0]?.longMessage ??
      error.errors[0]?.message ??
      ERROR_MESSAGES.NETWORK_ERROR
    )
  }
  return error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR
}

interface CachedProfileFields {
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
}

function patchCachedProfile(fields: CachedProfileFields) {
  const current = useUserStore.getState().user
  if (!current) return
  useUserStore.getState().setUser({ ...current, name: null, ...fields })
}

// The Clerk -> backend webhook sync is async, so `/users/me` can still
// return stale data right after saving (worse right after a deploy, while
// the backend is cold). Poll with backoff until it catches up, instead of
// trusting a single refetch, and warn the user if it never confirms.
const PROFILE_SYNC_RETRY_DELAYS_MS = [1000, 2000, 3000, 4000]

async function verifyBackendSynced(
  refetch: () => Promise<void>,
  fields: CachedProfileFields,
  isStale: () => boolean,
): Promise<boolean> {
  for (const delay of PROFILE_SYNC_RETRY_DELAYS_MS) {
    await new Promise((resolve) => setTimeout(resolve, delay))
    // A newer save has started since this one — let that one own the cache
    // and the sync check; nothing left here for this run to warn about.
    if (isStale()) return true

    await refetch()
    if (isStale()) return true

    const current = useUserStore.getState().user
    if (
      current?.firstName === fields.firstName &&
      current?.lastName === fields.lastName
    ) {
      return true
    }

    // refetch just overwrote the cache with the still-stale backend copy —
    // restore the optimistic value so the UI doesn't flicker back to it.
    patchCachedProfile(fields)
  }
  return false
}

export function EditProfileForm({ open, onOpenChange }: EditProfileFormProps) {
  const { user, isLoaded } = useUser()
  const { refetch: refetchApiUser } = useAuth()
  const submitTokenRef = useRef(0)
  const isUnmountedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { firstName: '', lastName: '' },
  })

  useEffect(
    () => () => {
      isUnmountedRef.current = true
    },
    [],
  )

  useEffect(() => {
    if (!open) return
    reset({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' })
    setAvatarPreview(user?.imageUrl ?? '')
    setAvatarFile(null)
    setFormError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user])

  const isBusy = isSubmitting || !isLoaded

  const handleClose = () => {
    if (isBusy) return
    onOpenChange(false)
  }

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (values: UpdateProfileValues) => {
    if (!user) {
      setFormError(ERROR_MESSAGES.SOMETHING_WENT_WRONG)
      return
    }

    setFormError(null)
    setIsSubmitting(true)
    try {
      await user.update({
        firstName: values.firstName,
        lastName: values.lastName,
      })

      if (avatarFile) {
        await user.setProfileImage({ file: avatarFile })
      }

      // Show what we just saved to Clerk immediately instead of waiting on
      // the backend copy, which only updates once its webhook from Clerk
      // has landed. Verify that sync in the background and warn if it
      // never confirms, instead of silently trusting it succeeded.
      const savedFields: CachedProfileFields = {
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.imageUrl,
      }
      patchCachedProfile(savedFields)

      toast.success(SUCCESS_MESSAGES.PROFILE_UPDATED)
      onOpenChange(false)

      const token = ++submitTokenRef.current
      // Stale once a newer save starts, or once this form is gone — an
      // unmounted run must not keep refetching or toast onto another page.
      const isStale = () =>
        isUnmountedRef.current || submitTokenRef.current !== token
      void verifyBackendSynced(refetchApiUser, savedFields, isStale).then(
        (synced) => {
          if (!synced && !isStale()) {
            toast.error(ERROR_MESSAGES.PROFILE_SYNC_DELAYED)
          }
        },
      )
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayName = user?.fullName ?? user?.firstName ?? 'Member'

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose()
      }}
      title="Edit Profile"
      actionVariant="default"
      textAction="Save Changes"
      textCancel="Cancel"
      isLoading={isBusy}
      errorMessage={formError}
      onClickAction={handleSubmit(onSubmit)}
      onClickCancel={handleClose}
      data-testid="modal-edit-profile"
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar
            name={displayName}
            src={avatarPreview}
            alt={displayName}
            size="lg"
          />
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="size-4" aria-hidden />
              Change photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Upload profile photo"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label
              htmlFor="edit-profile-first-name"
              className="mb-2 block text-xs font-semibold uppercase tracking-widest text-on-surface-variant"
            >
              First Name
            </Label>
            <Input
              id="edit-profile-first-name"
              disabled={isBusy}
              {...register('firstName')}
            />
            {errors.firstName && (
              <p role="alert" className="mt-1 text-sm text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor="edit-profile-last-name"
              className="mb-2 block text-xs font-semibold uppercase tracking-widest text-on-surface-variant"
            >
              Last Name
            </Label>
            <Input
              id="edit-profile-last-name"
              disabled={isBusy}
              {...register('lastName')}
            />
            {errors.lastName && (
              <p role="alert" className="mt-1 text-sm text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </AlertDialog>
  )
}
