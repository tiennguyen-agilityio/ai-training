'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignedOut } from '@clerk/nextjs'
import { Menu as MenuIcon } from 'lucide-react'

// Constants
import { ROUTES } from '@/constants/routes'

// Types
import { type MenuItem } from '@/types/menu'

// Components
import { SearchInput } from '@/components/SearchInput'
import { buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

// Utils
import { cn } from '@/utils/styles'

const navRowClass =
  'flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-medium transition-colors'

export interface MobileNavProps {
  className?: string
  items: MenuItem[]
}

export const MobileNav = ({ className, items }: MobileNavProps) => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'text-primary',
          className,
        )}
        aria-label="Open navigation menu"
      >
        <MenuIcon className="size-5" aria-hidden />
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[85vw] max-w-sm gap-0 bg-background p-0"
      >
        <SheetHeader className="border-b border-border px-4 py-4 pr-14">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Browse the shop
          </SheetDescription>
        </SheetHeader>

        <div className="border-b border-border p-4 md:hidden">
          <SearchInput
            disabled
            aria-label="Search products"
            containerClassName="h-11 w-full"
          />
        </div>

        <nav
          className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
          aria-label="Mobile"
        >
          {items.map((item) => {
            if (item.disabled) {
              return (
                <span
                  key={item.href + item.label}
                  className={cn(
                    navRowClass,
                    'cursor-not-allowed justify-between text-muted-foreground/60',
                  )}
                  aria-disabled="true"
                >
                  {item.label}
                </span>
              )
            }

            const isActive =
              item.match === 'exact'
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={cn(
                  navRowClass,
                  isActive
                    ? 'bg-muted font-semibold text-primary'
                    : 'text-foreground hover:bg-muted/60',
                )}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            )
          })}

          <SignedOut>
            <div
              className="my-2 border-t border-border"
              role="separator"
              aria-orientation="horizontal"
            />
            <Link
              href={ROUTES.SIGN_IN}
              className={cn(navRowClass, 'text-foreground hover:bg-muted/60')}
              onClick={() => setIsOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href={ROUTES.SIGN_UP}
              className={cn(navRowClass, 'text-foreground hover:bg-muted/60')}
              onClick={() => setIsOpen(false)}
            >
              Sign up
            </Link>
          </SignedOut>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
