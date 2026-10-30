import * as routes from '@/constants/routes'
import { ROUTES, dashboardEditPath } from '@/constants/routes'

describe('routes', () => {
  it('dashboardEditPath builds the edit route under a base', () => {
    expect(dashboardEditPath(ROUTES.DASHBOARD_CATEGORIES, 'cat-1')).toBe(
      '/dashboard/categories/cat-1/edit',
    )
    expect(dashboardEditPath(ROUTES.DASHBOARD_PRODUCTS, 'product-1')).toBe(
      '/dashboard/products/product-1/edit',
    )
  })

  it('dashboardEditPath encodes the id', () => {
    expect(dashboardEditPath(ROUTES.DASHBOARD_CATEGORIES, 'a/b')).toBe(
      '/dashboard/categories/a%2Fb/edit',
    )
  })

  it('exports no per-entity edit route helpers', () => {
    expect(routes).not.toHaveProperty('dashboardCategoryEditRoute')
    expect(routes).not.toHaveProperty('dashboardProductEditPath')
  })
})
