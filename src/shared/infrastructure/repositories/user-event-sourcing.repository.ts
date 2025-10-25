import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventBus } from '@nestjs/cqrs';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User, UserStatus } from '../../domain/entities/user.entity';
import { UserEntity } from '../../user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { EventStoreService } from '../event-store/event-store.service';

/**
 * UserEventSourcingRepository - Enhanced Repository with Event Sourcing
 * 
 * This repository implements the Repository pattern with Event Sourcing support:
 * - Persists aggregate state to the database (write model)
 * - Persists domain events to event store
 * - Publishes events to the event bus for projections
 * - Supports aggregate reconstruction from events
 * 
 * Pattern: Repository + Event Sourcing + CQRS
 */
@Injectable()
export class UserEventSourcingRepository implements UserRepository {
  private readonly logger = new Logger(UserEventSourcingRepository.name);

  constructor(
    @InjectRepository(UserEntity, 'write')
    private readonly userRepository: Repository<UserEntity>,
    private readonly eventStore: EventStoreService,
    private readonly eventBus: EventBus,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Save user aggregate with event sourcing
   * 
   * This method:
   * 1. Persists the aggregate state to the database
   * 2. Persists all uncommitted events to the event store
   * 3. Publishes events to the event bus for projections
   * 4. Commits the transaction
   */
  async save(user: User): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Save aggregate state (write model)
      const userEntity = this.mapDomainToEntity(user);
      await queryRunner.manager.save(UserEntity, userEntity);

      // 2. Get uncommitted events from the aggregate
      const uncommittedEvents = user.getUncommittedEvents();
      
      if (uncommittedEvents.length > 0) {
        // 3. Get current version
        const currentVersion = await this.eventStore.getLatestVersion(user.id.value);
        const newVersion = currentVersion + 1;

        // 4. Persist events to event store
        for (let i = 0; i < uncommittedEvents.length; i++) {
          const event = uncommittedEvents[i];
          await this.eventStore.appendEvent(
            user.id.value,
            'User',
            event,
            newVersion + i,
            {
              userId: user.id.value,
              correlationId: (event as any).metadata?.correlationId,
              causationId: (event as any).metadata?.causationId,
            },
          );
        }

        // 5. Publish events to event bus for projections and side effects
        for (const event of uncommittedEvents) {
          this.eventBus.publish(event);
        }

        // 6. Mark events as committed
        user.markEventsAsCommitted();

        this.logger.log(
          `Saved user ${user.id.value} with ${uncommittedEvents.length} events (v${newVersion})`,
        );
      } else {
        this.logger.log(`Saved user ${user.id.value} (no new events)`);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to save user: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find user by ID from current state (not from events)
   */
  async findById(id: UserId): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ 
      where: { id: id.value } 
    });
    
    if (!userEntity) {
      return null;
    }
    
    return this.mapEntityToDomain(userEntity);
  }

  /**
   * Find user by email from current state
   */
  async findByEmail(email: Email): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ 
      where: { email: email.value } 
    });
    
    if (!userEntity) {
      return null;
    }
    
    return this.mapEntityToDomain(userEntity);
  }

  /**
   * Reconstruct user aggregate from event history
   * 
   * This method demonstrates Event Sourcing:
   * - Fetches all events for the aggregate
   * - Replays events to rebuild the state
   * - Returns the fully reconstituted aggregate
   */
  async findByIdFromEvents(id: UserId): Promise<User | null> {
    try {
      const events = await this.eventStore.getEventsForAggregate(id.value);
      
      if (events.length === 0) {
        return null;
      }

      // Create empty aggregate
      let user: User | null = null;

      // Replay events to rebuild state
      for (const eventEntity of events) {
        const eventData = eventEntity.eventData;
        
        // Apply each event to rebuild the aggregate
        // This is a simplified example - in production, you'd use a proper event replay mechanism
        if (!user) {
          // First event should be UserRegisteredEvent
          if (eventEntity.eventType === 'UserRegisteredEvent') {
            user = User.fromPersistence(
              eventData.userId,
              eventData.email,
              eventData.userData.password,
              eventData.userData.firstName,
              eventData.userData.lastName,
              eventData.userData.phone,
            );
          }
        } else {
          // Apply subsequent events
          this.applyEventToAggregate(user, eventEntity);
        }
      }

      this.logger.log(`Reconstructed user ${id.value} from ${events.length} events`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to reconstruct user from events: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete user (both state and optionally events)
   */
  async delete(id: UserId): Promise<void> {
    await this.userRepository.delete({ id: id.value });
    this.logger.log(`Deleted user ${id.value}`);
  }

  /**
   * Check if user exists
   */
  async exists(id: UserId): Promise<boolean> {
    const count = await this.userRepository.count({ where: { id: id.value } });
    return count > 0;
  }

  /**
   * Get event history for a user
   */
  async getEventHistory(id: UserId): Promise<any[]> {
    const events = await this.eventStore.getEventsForAggregate(id.value);
    return events.map(e => e.toPlainObject());
  }

  // ===== Private Helper Methods =====

  /**
   * Map domain User to persistence UserEntity
   */
  private mapDomainToEntity(user: User): UserEntity {
    const userEntity = new UserEntity();
    userEntity.id = user.id.value;
    userEntity.email = user.email.value;
    userEntity.password = user.password.value;
    userEntity.firstName = user.firstName.value;
    userEntity.lastName = user.lastName.value;
    userEntity.phone = user.phone?.value;
    userEntity.status = user.status;
    userEntity.lastLoginAt = user.lastLoginAt;
    userEntity.role_id = user.roleId?.value;
    userEntity.createdAt = user.createdAt;
    userEntity.updatedAt = user.updatedAt;
    
    return userEntity;
  }

  /**
   * Map persistence UserEntity to domain User
   */
  private mapEntityToDomain(userEntity: UserEntity): User {
    return User.fromPersistence(
      userEntity.id,
      userEntity.email,
      userEntity.password,
      userEntity.firstName,
      userEntity.lastName,
      userEntity.phone,
      [], // roles
      userEntity.status as UserStatus,
      userEntity.lastLoginAt,
      userEntity.role_id,
      userEntity.createdAt?.toISOString(),
      userEntity.updatedAt?.toISOString(),
    );
  }

  /**
   * Apply an event to an aggregate (for event replay)
   */
  private applyEventToAggregate(user: User, eventEntity: any): void {
    const eventType = eventEntity.eventType;
    const eventData = eventEntity.eventData;

    switch (eventType) {
      case 'UserLoginSuccessEvent':
        // Solo actualizar lastLoginAt
        user.updateLastLogin();
        break;
      
      case 'EmailVerificationSuccessEvent':
        user.verifyEmail();
        break;
      
      // Add more event handlers as needed
      default:
        this.logger.debug(`No handler for event type: ${eventType}`);
    }
  }

  // ===== Additional methods from original repository =====

  async findAll(): Promise<User[]> {
    const entities = await this.userRepository.find();
    return entities.map(entity => this.mapEntityToDomain(entity));
  }

  async count(): Promise<number> {
    return await this.userRepository.count();
  }

  async emailExists(email: Email): Promise<boolean> {
    const count = await this.userRepository.count({ where: { email: email.value } });
    return count > 0;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { phone: phoneNumber } });
    if (!userEntity) return null;
    return this.mapEntityToDomain(userEntity);
  }


  async findByRole(roleId: string): Promise<User[]> {
    // This would require a join with roles table
    // For now, return empty array as roles are not fully implemented
    return [];
  }

  async search(criteria: any, options: any): Promise<any> {
    // Simple implementation - can be enhanced
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    
    if (criteria.email) {
      queryBuilder.andWhere('user.email ILIKE :email', { email: `%${criteria.email}%` });
    }
    if (criteria.firstName) {
      queryBuilder.andWhere('user.firstName ILIKE :firstName', { firstName: `%${criteria.firstName}%` });
    }
    if (criteria.lastName) {
      queryBuilder.andWhere('user.lastName ILIKE :lastName', { lastName: `%${criteria.lastName}%` });
    }
    if (criteria.status) {
      queryBuilder.andWhere('user.status = :status', { status: criteria.status });
    }

    queryBuilder.skip(options.skip || 0).take(options.limit || 10);
    
    const [entities, total] = await queryBuilder.getManyAndCount();
    const users = entities.map(entity => this.mapEntityToDomain(entity));
    
    return {
      users,
      total,
      hasMore: (options.skip || 0) + users.length < total,
    };
  }

  async updateLastLogin(id: UserId, loginAt: Date): Promise<void> {
    await this.userRepository.update({ id: id.value }, { lastLoginAt: loginAt });
  }

  async updateProfile(id: UserId, profileData: any): Promise<void> {
    const updateData: any = {};
    if (profileData.firstName) updateData.firstName = profileData.firstName;
    if (profileData.lastName) updateData.lastName = profileData.lastName;
    if (profileData.phone) updateData.phone = profileData.phone;
    
    if (Object.keys(updateData).length > 0) {
      await this.userRepository.update(id.value, updateData);
    }
  }

  async countByStatus(status: string): Promise<number> {
    return await this.userRepository.count({ where: { status: status as UserStatus } });
  }

  async findByIds(ids: UserId[]): Promise<User[]> {
    const idValues = ids.map(id => id.value);
    const entities = await this.userRepository.findByIds(idValues);
    return entities.map(entity => this.mapEntityToDomain(entity));
  }

  async findUnverifiedUsersOlderThan(date: Date): Promise<User[]> {
    const entities = await this.userRepository.find({
      where: {
        status: UserStatus.PENDING_VERIFICATION,
        createdAt: { $lt: date } as any,
      },
    });
    return entities.map(entity => this.mapEntityToDomain(entity));
  }

  async bulkUpdateStatus(ids: UserId[], status: string): Promise<void> {
    const idValues = ids.map(id => id.value);
    await this.userRepository.update(idValues, { status: status as UserStatus });
  }

  async updateUserForProvider(id: string, updateFields: any): Promise<void> {
    await this.userRepository.update(id, updateFields);
  }

  async findCreatedBetween(startDate: Date, endDate: Date): Promise<User[]> {
    const entities = await this.userRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :startDate', { startDate })
      .andWhere('user.createdAt <= :endDate', { endDate })
      .getMany();
    return entities.map(entity => this.mapEntityToDomain(entity));
  }

  async getStatistics(): Promise<any> {
    const total = await this.count();
    const active = await this.countByStatus(UserStatus.ACCEPTED);
    const inactive = await this.countByStatus(UserStatus.INACTIVE);
    const suspended = await this.countByStatus(UserStatus.SUSPENDED);
    const pendingVerification = await this.countByStatus(UserStatus.PENDING_VERIFICATION);
    
    const verifiedEmails = await this.userRepository.count({ where: { status: UserStatus.ACCEPTED } });
    const unverifiedEmails = await this.userRepository.count({ where: { status: UserStatus.PENDING_VERIFICATION } });

    return {
      total,
      active,
      inactive,
      suspended,
      pendingVerification,
      verifiedEmails,
      unverifiedEmails,
    };
  }
}

