import { render, screen } from '@testing-library/react'

import PageHeader from '.'
import { ROUTES } from '@/constants/routes'

jest.mock('next/navigation', () => ({
  usePathname: () => ROUTES.DASHBOARD_CATEGORIES_ADD,
}))

const breadcrumbItems = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD },
  { label: 'Categories', href: ROUTES.DASHBOARD_CATEGORIES },
]

describe('PageHeader', () => {
  it('renders the breadcrumb, the title as a level-1 heading and the actions', () => {
    render(
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        title="Add Category"
        actions={<button type="submit">Create category</button>}
      />,
    )

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      ROUTES.DASHBOARD,
    )
    expect(screen.getByRole('link', { name: 'Categories' })).toHaveAttribute(
      'href',
      ROUTES.DASHBOARD_CATEGORIES,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Add Category' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create category' }),
    ).toBeInTheDocument()
  })

  it('renders the description only when given', () => {
    const { container, rerender } = render(
      <PageHeader breadcrumbItems={breadcrumbItems} title="Products" />,
    )
    expect(container.querySelector('header p')).toBeNull()

    rerender(
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        title="Products"
        description="Oversee your products"
      />,
    )
    expect(screen.getByText('Oversee your products')).toBeInTheDocument()
  })

  it('keeps the category title classes by default', () => {
    render(
      <PageHeader breadcrumbItems={breadcrumbItems} title="Add Category" />,
    )

    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveClass('font-headline', 'text-4xl', 'font-semibold')
  })

  it('merges titleClassName over the default title classes', () => {
    render(
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        title="Add Product"
        titleClassName="text-5xl"
      />,
    )

    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveClass('text-5xl')
    expect(title).not.toHaveClass('text-4xl')
  })
})
