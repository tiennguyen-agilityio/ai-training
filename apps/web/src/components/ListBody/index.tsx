'use client'

import type { ReactNode } from 'react'

import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'

interface ListBodyProps {
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
  isFetching: boolean
  onRetry?: () => void
  children: ReactNode
}

/**
 * A dashboard list's body: Loading on first load, the error (with Retry when
 * `onRetry` is given), otherwise the list under an overlay while refetching.
 */
const ListBody = ({
  isLoading,
  isError,
  errorMessage,
  isFetching,
  onRetry,
  children,
}: ListBodyProps) => {
  if (isLoading) {
    return (
      <div className="px-6 py-12 text-center text-muted-foreground">
        <Loading />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <p className="text-muted-foreground">{errorMessage}</p>
        {onRetry && (
          <Button
            className="w-fit px-6"
            variant="destructive"
            size="sm"
            onClick={() => onRetry()}
          >
            Retry
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      {isFetching && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/60 backdrop-blur-[1px]">
          <Loading size="sm" />
        </div>
      )}
      {children}
    </div>
  )
}

export default ListBody
