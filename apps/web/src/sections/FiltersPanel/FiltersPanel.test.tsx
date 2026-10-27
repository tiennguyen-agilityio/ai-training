import { render, screen } from '@testing-library/react'

import {
  ROAST_LEVEL_OPTIONS,
  ROAST_SORT_OPTIONS,
  ROAST_SORT_VALUE,
} from '@/constants/roast'
import FiltersPanel from '@/sections/FiltersPanel'

describe('FiltersPanel', () => {
  it('names the sort select', () => {
    render(
      <FiltersPanel
        searchQuery=""
        onSearchChange={jest.fn()}
        priceRange={[1, 100]}
        onPriceRangeChange={jest.fn()}
        minPrice={1}
        maxPrice={100}
        roastLevelOptions={ROAST_LEVEL_OPTIONS}
        selectedRoastLevels={[]}
        onToggleRoastLevel={jest.fn()}
        sortOptions={ROAST_SORT_OPTIONS}
        sortBy={ROAST_SORT_VALUE.CURATED}
        onSortByChange={jest.fn()}
      />,
    )

    expect(
      screen.getByRole('combobox', { name: 'Sort by' }),
    ).toBeInTheDocument()
  })
})
