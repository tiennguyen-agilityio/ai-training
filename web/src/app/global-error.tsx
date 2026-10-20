'use client'

import { useEffect } from 'react'
import { Abel, Plus_Jakarta_Sans } from 'next/font/google'

import ErrorFallback from '@/components/ErrorFallback'
import { ROUTES } from '@/constants/routes'

import './globals.css'

const fontBody = Plus_Jakarta_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const fontHeading = Abel({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400'],
})

// Mirrors next-themes' own no-flash script: ThemeProvider never mounts here
// because global-error replaces the root layout, so the `dark` class has to
// be applied manually before paint using the same storageKey it uses.
const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('node-brew-theme');
    var isDark =
      stored === 'dark' ||
      (stored !== 'light' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default function GlobalError({
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Something went wrong</title>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body
        suppressHydrationWarning
        className={`${fontBody.variable} ${fontHeading.variable} antialiased`}
      >
        <ErrorFallback
          reset={reset}
          homeHref={ROUTES.HOME}
          homeLabel="Back to Home"
          minHeightClassName="min-h-svh"
        />
      </body>
    </html>
  )
}
