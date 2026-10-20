import { PaginatedResult } from '../dto/pagination.dto.js';

export function mapPaginatedResult<T, R>(
  result: PaginatedResult<T>,
  mapper: (item: T) => R,
): PaginatedResult<R> {
  return { data: result.data.map(mapper), meta: result.meta };
}
