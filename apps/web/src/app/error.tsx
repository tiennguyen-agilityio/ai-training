'use client'

import { useEffect } from 'react'

import ErrorFallback from '@/components/ErrorFallback'
import { ROUTES } from '@/constants/routes'

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorFallback
      reset={reset}
      homeHref={ROUTES.HOME}
      homeLabel="Back to Home"
      minHeightClassName="min-h-svh"
    />
  )
}
