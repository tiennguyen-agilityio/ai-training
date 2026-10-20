import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformResponseInterceptor } from './transform-response.interceptor.js';
import { PaginatedResult } from '../dto/pagination.dto.js';

describe('TransformResponseInterceptor', () => {
  let interceptor: TransformResponseInterceptor<unknown>;
  const context = {} as ExecutionContext;

  beforeEach(() => {
    interceptor = new TransformResponseInterceptor();
  });

  const handlerFor = (value: unknown): CallHandler =>
    ({ handle: () => of(value) }) as CallHandler;

  const run = (value: unknown): Promise<unknown> =>
    new Promise((resolve) => {
      interceptor
        .intercept(context, handlerFor(value))
        .subscribe((result) => resolve(result));
    });

  it('wraps a plain object as { data: value }', async () => {
    const value = { id: '1', name: 'Jane' };

    const result = await run(value);

    expect(result).toEqual({ data: value });
  });

  it('wraps a non-paginated array as { data: value }', async () => {
    const value = [1, 2, 3];

    const result = await run(value);

    expect(result).toEqual({ data: value });
  });

  it('passes a PaginatedResult through unchanged, without re-wrapping', async () => {
    const paginated: PaginatedResult<number> = {
      data: [1, 2, 3],
      meta: { limit: 10, currentPage: 1, pageCount: 1, totalCount: 3 },
    };

    const result = await run(paginated);

    expect(result).toBe(paginated);
  });

  it('passes undefined through unchanged for 204 responses', async () => {
    const result = await run(undefined);

    expect(result).toBeUndefined();
  });
});
