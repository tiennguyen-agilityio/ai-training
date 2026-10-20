import type { Metadata } from 'next'
import Link from 'next/link'
import { Coffee } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/styles'

export const metadata: Metadata = {
  title: 'Page not found',
}

export default function NotFound() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex size-18 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Coffee className="size-8" aria-hidden />
        </div>
        <p className="mt-6 text-sm font-semibold tracking-[0.28em] text-primary uppercase">
          404 Error
        </p>
        <h1 className="mt-2 text-4xl leading-tight font-semibold text-on-surface md:text-5xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-on-surface-variant">
          We could not find the page you are looking for. It may have been moved
          or no longer exists.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ROUTES.HOME}
            className={cn(buttonVariants(), 'w-auto px-8')}
          >
            Back to Home
          </Link>
          <Link
            href="/roasts"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'w-auto px-8',
            )}
          >
            Shop Roasts
          </Link>
        </div>
      </div>
    </div>
  )
}
