import { User } from '../entities/user.entity';
import { UserId } from '../value-objects/user-id.vo';
import { Email } from '../value-objects/email.vo';

export interface UserSearchCriteria {
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  emailVerified?: boolean;
  roleIds?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface UserSearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'firstName' | 'lastName';
  sortOrder?: 'asc' | 'desc';
}

export interface UserSearchResult {
  users: User[];
  total: number;
  hasMore: boolean;
}

export abstract class UserRepository {
  /**
   * Save a user entity
   */
  abstract save(user: User): Promise<void>;

  /**
   * Find a user by ID
   */
  abstract findById(id: UserId): Promise<User | null>;

  /**
   * Find a user by email
   */
  abstract findByEmail(email: Email): Promise<User | null>;

  /**
   * Find a user by phone number
   */
  abstract findByPhoneNumber(phone: string): Promise<User | null>;

  /**
   * Find users by role
   */
  abstract findByRole(roleId: string): Promise<User[]>;

  /**
   * Search users with criteria and pagination
   */
  abstract search(
    criteria: UserSearchCriteria,
    options?: UserSearchOptions,
  ): Promise<UserSearchResult>;

  /**
   * Check if email exists
   */
  abstract emailExists(email: Email): Promise<boolean>;

  /**
   * Delete a user by ID
   */
  abstract delete(id: UserId): Promise<void>;

  /**
   * Get total count of users
   */
  abstract count(): Promise<number>;

  /**
   * Get users count by status
   */
  abstract countByStatus(status: string): Promise<number>;

  /**
   * Find users with unverified emails older than specified date
   */
  abstract findUnverifiedUsersOlderThan(date: Date): Promise<User[]>;

  /**
   * Find users by multiple IDs
   */
  abstract findByIds(ids: UserId[]): Promise<User[]>;

  /**
   * Update user last login timestamp
   */
  abstract updateLastLogin(id: UserId, timestamp: Date): Promise<void>;

  /**
   * Update user profile
   */
  abstract updateProfile(id: UserId, profileData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    status?: string;
  }): Promise<void>;

  /**
   * Update user by ID with provided fields
   */
  abstract updateUserForMilio(id: string, updateFields: any): Promise<void>;

  /**
   * Bulk update user status
   */
  abstract bulkUpdateStatus(ids: UserId[], status: string): Promise<void>;

  /**
   * Find users created within date range
   */
  abstract findCreatedBetween(startDate: Date, endDate: Date): Promise<User[]>;

  /**
   * Get user statistics
   */
  abstract getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    pendingVerification: number;
    verifiedEmails: number;
    unverifiedEmails: number;
  }>;
}
