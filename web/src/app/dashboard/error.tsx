'use client'

import { useEffect } from 'react'

import ErrorFallback from '@/components/ErrorFallback'
import { ROUTES } from '@/constants/routes'

export default function DashboardErrorBoundary({
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
      homeHref={ROUTES.DASHBOARD}
      homeLabel="Back to Dashboard"
      minHeightClassName="min-h-[50vh]"
    />
  )
}
