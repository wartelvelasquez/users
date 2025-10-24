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
 * CQRS Query Handler - Complex search with filters and pagination
 * Uses optimized indexes on user table
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

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters.kycStatus) {
      queryBuilder.andWhere('user.kyc_status = :kycStatus', { kycStatus: filters.kycStatus });
    }

    if (filters.emailVerified !== undefined) {
      queryBuilder.andWhere('user.email_verified = :emailVerified', {
        emailVerified: filters.emailVerified,
      });
    }

    if (filters.kycPointsPaid !== undefined) {
      queryBuilder.andWhere('user.kyc_points_paid = :kycPointsPaid', {
        kycPointsPaid: filters.kycPointsPaid,
      });
    }

    if (filters.kycProfile !== undefined) {
      queryBuilder.andWhere('user.kyc_profile = :kycProfile', {
        kycProfile: filters.kycProfile,
      });
    }

    if (filters.pallaAccount !== undefined) {
      queryBuilder.andWhere('user.palla_account = :pallaAccount', {
        pallaAccount: filters.pallaAccount,
      });
    }

    if (filters.country) {
      queryBuilder.andWhere('user.country = :country', { country: filters.country });
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere('user.tags && :tags', { tags: filters.tags });
    }

    if (filters.createdAfter) {
      queryBuilder.andWhere('user.created_at >= :createdAfter', {
        createdAfter: filters.createdAfter,
      });
    }

    if (filters.createdBefore) {
      queryBuilder.andWhere('user.created_at <= :createdBefore', {
        createdBefore: filters.createdBefore,
      });
    }

    if (filters.lastLoginAfter) {
      queryBuilder.andWhere('user.last_login_at >= :lastLoginAfter', {
        lastLoginAfter: filters.lastLoginAfter,
      });
    }

    if (filters.lastLoginBefore) {
      queryBuilder.andWhere('user.last_login_at <= :lastLoginBefore', {
        lastLoginBefore: filters.lastLoginBefore,
      });
    }

    // Full-text search
    if (filters.searchTerm) {
      queryBuilder.andWhere(
        "user.search_vector @@ plainto_tsquery('english', :searchTerm)",
        { searchTerm: filters.searchTerm },
      );
    }

    // Apply sorting
    const sortBy = pagination.sortBy ?? 'created_at';
    const sortOrder = pagination.sortOrder ?? 'DESC';
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

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

