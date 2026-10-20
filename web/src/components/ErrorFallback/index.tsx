'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { ERROR_MESSAGES } from '@/constants/messages'
import { cn } from '@/utils/styles'

const RETRY_SAFETY_TIMEOUT_MS = 800

interface ErrorFallbackProps {
  reset: () => void
  homeHref: string
  homeLabel: string
  minHeightClassName?: string
}

export default function ErrorFallback({
  reset,
  homeHref,
  homeLabel,
  minHeightClassName = 'min-h-[60vh]',
}: ErrorFallbackProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const retryTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Something went wrong'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  const handleRetry = () => {
    setIsRetrying(true)
    retryTimeoutRef.current = window.setTimeout(() => {
      setIsRetrying(false)
    }, RETRY_SAFETY_TIMEOUT_MS)
    reset()
  }

  return (
    <div
      className={cn(
        'flex w-full items-center justify-center px-4 py-16',
        minHeightClassName,
      )}
    >
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex size-18 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-8" aria-hidden />
        </div>
        <p className="mt-6 text-sm font-semibold tracking-[0.28em] text-destructive uppercase">
          500 Error
        </p>
        <h1 className="mt-2 text-4xl leading-tight font-semibold text-on-surface md:text-5xl">
          Something went wrong
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-on-surface-variant">
          {ERROR_MESSAGES.SOMETHING_WENT_WRONG}. Please try again, or head back
          to a page that works.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            className="w-auto px-8"
            loading={isRetrying}
            onClick={handleRetry}
          >
            Try again
          </Button>
          <Link
            href={homeHref}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'w-auto px-8',
            )}
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
