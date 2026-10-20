import { slugFrom } from './slug.util.js';

describe('slugFrom', () => {
  it('converts a simple name to a lowercase, hyphenated slug', () => {
    expect(slugFrom('Espresso')).toBe('espresso');
  });

  it('produces the same slug regardless of leading/trailing whitespace', () => {
    expect(slugFrom('  Espresso  ')).toBe(slugFrom('Espresso'));
  });

  it('strips diacritics into an ASCII slug', () => {
    expect(slugFrom('Café')).toBe('cafe');
  });

  it('hyphenates multi-word names', () => {
    expect(slugFrom('Cold Brew Concentrate')).toBe('cold-brew-concentrate');
  });
});
