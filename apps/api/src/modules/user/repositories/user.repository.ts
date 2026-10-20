import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity.js';
import type { CreateUserInput, UserFilters } from '../dto/user.schema.js';
import { BaseRepository } from '../../../common/repositories/base.repository.js';
import {
  FindOptions,
  ListOptions,
} from '../../../common/interfaces/repository-options.interface.js';
import { PaginatedResult } from '../../../common/dto/pagination.dto.js';
import { QueryParams } from '../../../common/dto/query-params.dto.js';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  protected readonly entity = User;

  findByEmail(email: string, options?: FindOptions): Promise<User | null> {
    return this.findOneBy({ email }, options);
  }

  findByClerkId(clerkId: string, options?: FindOptions): Promise<User | null> {
    return this.findOneBy({ clerkId }, options);
  }

  findAll(
    query: QueryParams,
    filters: UserFilters = {},
    options?: FindOptions,
  ): Promise<PaginatedResult<User>> {
    const where: ListOptions<User>['where'] = {};
    if (filters.role) where.role = filters.role;

    return this.paginate(query, {
      where,
      includeDeleted: options?.includeDeleted,
      excludeId: options?.excludeId,
      search: {
        term: query.search,
        fields: ['email', 'firstName', 'lastName'],
      },
    });
  }

  create(data: CreateUserInput): Promise<User> {
    return this.createAndSave({ ...data });
  }
}
