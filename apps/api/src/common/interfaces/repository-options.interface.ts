export interface FindOptions {
  includeDeleted?: boolean;
  excludeId?: string;
}

/** Equality criteria by field. An array value matches any of its items. */
export type Criteria<T> = Partial<Record<keyof T & string, unknown>>;

export interface SearchOptions<T> {
  term?: string;
  fields: (keyof T & string)[];
}

export interface OrderByOptions<T> {
  field: keyof T & string;
  direction: 'ASC' | 'DESC';
}

export interface ListOptions<T> extends FindOptions {
  where?: Criteria<T>;
  search?: SearchOptions<T>;
  relations?: string[];
  orderBy?: OrderByOptions<T>;
}
