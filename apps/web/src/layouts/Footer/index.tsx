import React from 'react'
import Link from 'next/link'
import { Camera, Globe, Mail } from 'lucide-react'

import Logo from '@/components/Logo'
import CopyRight from './CopyRIght'

const Footer = () => {
  return (
    <footer className="w-full border-t border-border bg-background text-on-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-8 py-16">
        <div className="font-headline text-2xl text-on-surface">
          <Logo />
        </div>
        <nav
          className="flex flex-wrap justify-center gap-8 text-sm tracking-wide md:gap-10"
          aria-label="Footer"
        >
          {[
            ['Journal', '#'],
            ['Ethical Sourcing', '#'],
            ['Shipping Policy', '#'],
            ['Privacy', '#'],
            ['Contact', '#'],
          ].map(([label, href]) =>
            href === '#' ? (
              <span
                key={label}
                aria-disabled="true"
                className="cursor-not-allowed text-on-surface/50 opacity-50"
              >
                {label}
              </span>
            ) : (
              <Link
                key={label}
                href={href}
                className="text-on-surface/50 transition-opacity hover:text-on-surface"
              >
                {label}
              </Link>
            ),
          )}
        </nav>
        <div className="mt-2 flex gap-6">
          <button
            disabled
            type="button"
            className="flex size-10 items-center justify-center rounded-full bg-surface-container-high text-primary transition-all enabled:hover:bg-primary enabled:hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Website"
          >
            <Globe className="size-4" />
          </button>
          <button
            disabled
            type="button"
            className="flex size-10 items-center justify-center rounded-full bg-surface-container-high text-primary transition-all enabled:hover:bg-primary enabled:hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Email"
          >
            <Mail className="size-4" />
          </button>
          <button
            disabled
            type="button"
            className="flex size-10 items-center justify-center rounded-full bg-surface-container-high text-primary transition-all enabled:hover:bg-primary enabled:hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Social"
          >
            <Camera className="size-4" />
          </button>
        </div>
        <CopyRight />
      </div>
    </footer>
  )
}

export default Footer
