import { mapPaginatedResult } from './pagination.util.js';

describe('mapPaginatedResult', () => {
  it('maps each row through the mapper and passes meta through unchanged', () => {
    const meta = { limit: 10, currentPage: 1, pageCount: 1, totalCount: 2 };

    const result = mapPaginatedResult(
      { data: [1, 2], meta },
      (value) => value * 10,
    );

    expect(result).toEqual({ data: [10, 20], meta });
  });

  it('returns an empty data array for an empty result', () => {
    const meta = { limit: 10, currentPage: 1, pageCount: 0, totalCount: 0 };

    const result = mapPaginatedResult({ data: [], meta }, (value: number) =>
      String(value),
    );

    expect(result).toEqual({ data: [], meta });
  });
});
