import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ROUTES, dashboardEditPath } from '@/constants/routes'
import { CategoryTableRow } from '@/sections/CategoryTableRow'

const activeCategory = {
  id: 'cat-1',
  name: 'Espresso',
  slug: 'espresso',
  createdBy: null,
  updatedBy: null,
  deletedBy: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
}

const deletedCategory = {
  ...activeCategory,
  deletedAt: '2026-01-02T00:00:00.000Z',
}

describe('CategoryTableRow', () => {
  it('calls onRequestDelete when remove is clicked', async () => {
    const user = userEvent.setup()
    const onRequestDelete = jest.fn()

    render(
      <table>
        <tbody>
          <tr>
            <CategoryTableRow
              category={activeCategory}
              onRequestDelete={onRequestDelete}
            />
          </tr>
        </tbody>
      </table>,
    )

    await user.click(screen.getByRole('button', { name: /remove espresso/i }))
    expect(onRequestDelete).toHaveBeenCalledTimes(1)
    expect(onRequestDelete).toHaveBeenCalledWith(activeCategory)
  })

  it('shows Restore instead of Remove on a deleted row', () => {
    render(
      <table>
        <tbody>
          <tr>
            <CategoryTableRow category={deletedCategory} />
          </tr>
        </tbody>
      </table>,
    )

    expect(
      screen.queryByRole('button', { name: /remove espresso/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /restore espresso/i }),
    ).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: /edit espresso/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /edit espresso/i }),
    ).not.toBeInTheDocument()
  })

  it('calls onRequestRestore when restore is clicked', async () => {
    const user = userEvent.setup()
    const onRequestRestore = jest.fn()

    render(
      <table>
        <tbody>
          <tr>
            <CategoryTableRow
              category={deletedCategory}
              onRequestRestore={onRequestRestore}
            />
          </tr>
        </tbody>
      </table>,
    )

    await user.click(screen.getByRole('button', { name: /restore espresso/i }))
    expect(onRequestRestore).toHaveBeenCalledTimes(1)
    expect(onRequestRestore).toHaveBeenCalledWith(deletedCategory)
  })

  it('does not show Restore on a live row', () => {
    render(
      <table>
        <tbody>
          <tr>
            <CategoryTableRow category={activeCategory} />
          </tr>
        </tbody>
      </table>,
    )

    expect(
      screen.queryByRole('button', { name: /restore espresso/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /remove espresso/i }),
    ).toBeInTheDocument()
  })

  it('shows the Edit link on a live row', () => {
    render(
      <table>
        <tbody>
          <tr>
            <CategoryTableRow category={activeCategory} />
          </tr>
        </tbody>
      </table>,
    )

    expect(
      screen.getByRole('link', { name: /edit espresso/i }),
    ).toHaveAttribute(
      'href',
      dashboardEditPath(ROUTES.DASHBOARD_CATEGORIES, 'cat-1'),
    )
  })

  it('disables Restore when the category has no id', async () => {
    const user = userEvent.setup()
    const onRequestRestore = jest.fn()

    render(
      <table>
        <tbody>
          <tr>
            <CategoryTableRow
              category={{ ...deletedCategory, id: '' }}
              onRequestRestore={onRequestRestore}
            />
          </tr>
        </tbody>
      </table>,
    )

    const restore = screen.getByRole('button', { name: /restore espresso/i })
    expect(restore).toBeDisabled()
    await user.click(restore)
    expect(onRequestRestore).not.toHaveBeenCalled()
  })

  it('exposes full slug via title on slug cell when slug is non-empty', () => {
    const longSlug = 'very-long-category-slug-for-truncation-testing'

    render(
      <table>
        <tbody>
          <tr>
            <CategoryTableRow
              category={{ ...activeCategory, slug: longSlug }}
            />
          </tr>
        </tbody>
      </table>,
    )

    const slugCode = screen.getByText(longSlug)
    expect(slugCode).toHaveAttribute('title', longSlug)
  })
})
