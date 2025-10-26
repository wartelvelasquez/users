import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchUsersQuery } from '../search-users.query';
import { UserProjectionEntity } from '../../../../shared/infrastructure/entities/user-projection.entity';

export interface SearchUsersResult {
  users: UserProjectionEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Handler for SearchUsersQuery
 * 
 * CQRS Query Handler - Busca en BD de LECTURA (users_read)
 */
@QueryHandler(SearchUsersQuery)
export class SearchUsersHandler implements IQueryHandler<SearchUsersQuery> {
  constructor(
    @InjectRepository(UserProjectionEntity, 'read')
    private readonly projectionRepository: Repository<UserProjectionEntity>,
  ) {}

  async execute(query: SearchUsersQuery): Promise<SearchUsersResult> {
    const { filters, pagination } = query;
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    // Build query
    const queryBuilder = this.projectionRepository.createQueryBuilder('user');

    // Apply sorting
    queryBuilder.orderBy('user.createdAt', pagination.sortOrder ?? 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const users = await queryBuilder.getMany();

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
