/**
 * Query to search users with filters and pagination
 * 
 * CQRS Read Model - Optimized for complex searches
 */
export interface UserSearchFilters {
  status?: string;
  kycStatus?: string;
  emailVerified?: boolean;
  kycPointsPaid?: boolean;
  kycProfile?: boolean;
  pallaAccount?: boolean;
  country?: string;
  tags?: string[];
  searchTerm?: string; // Full-text search
  createdAfter?: Date;
  createdBefore?: Date;
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export class SearchUsersQuery {
  constructor(
    public readonly filters: UserSearchFilters = {},
    public readonly pagination: PaginationOptions = { page: 1, limit: 10 },
  ) {}
}

