import { ROAST_LEVEL_SPECTRUM_PERCENT } from '@/constants/roast'
import { RoastLevel } from '@repo/constants'

describe('ROAST_LEVEL_SPECTRUM_PERCENT', () => {
  it('maps LIGHT to a left-biased position', () => {
    expect(ROAST_LEVEL_SPECTRUM_PERCENT[RoastLevel.LIGHT]).toBe(15)
  })

  it('maps MEDIUM to center', () => {
    expect(ROAST_LEVEL_SPECTRUM_PERCENT[RoastLevel.MEDIUM]).toBe(50)
  })

  it('maps DARK to a right-biased position', () => {
    expect(ROAST_LEVEL_SPECTRUM_PERCENT[RoastLevel.DARK]).toBe(85)
  })
})
