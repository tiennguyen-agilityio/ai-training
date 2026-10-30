import type { ReactNode } from 'react'

import Breadcrumb, { type BreadcrumbNavItem } from '@/components/Breadcrumb'
import { cn } from '@/utils/styles'

export interface PageHeaderProps {
  breadcrumbItems: BreadcrumbNavItem[]
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
  titleClassName?: string
}

const PageHeader = ({
  breadcrumbItems,
  title,
  description,
  actions,
  className,
  titleClassName,
}: PageHeaderProps) => (
  <header
    className={cn('flex flex-wrap items-end justify-between gap-4', className)}
  >
    <div className="space-y-3">
      <Breadcrumb items={breadcrumbItems} />
      <div className="space-y-2">
        <h1
          className={cn(
            'font-headline text-4xl leading-tight font-semibold tracking-tight text-foreground',
            titleClassName,
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="text-lg text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-3">{actions}</div>
    )}
  </header>
)

export default PageHeader
