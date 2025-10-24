import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import { UserLoginSuccessEvent } from '../../domain/events/user-login-success.event';
import { UserProjectionService } from './user-projection.service';

/**
 * Event Handlers for User Projections
 * 
 * These handlers listen to domain events and update the CQRS read model.
 * They ensure eventual consistency between the write model (aggregates)
 * and the read model (projections).
 * 
 * Pattern: Event-Driven Architecture + CQRS
 */

/**
 * Handles UserRegisteredEvent to create a new user projection
 */
@EventsHandler(UserRegisteredEvent)
export class UserRegisteredProjectionHandler implements IEventHandler<UserRegisteredEvent> {
  private readonly logger = new Logger(UserRegisteredProjectionHandler.name);

  constructor(private readonly projectionService: UserProjectionService) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    this.logger.log(`Handling UserRegisteredEvent for user ${event.userId}`);

    try {
      await this.projectionService.createProjection({
        id: event.userId,
        email: event.email,
        firstName: event.userData.firstName,
        lastName: event.userData.lastName,
        status: event.userData.status,
        phone: event.userData.phone,
        createdAt: event.occurredAt,
      });

      this.logger.log(`Created projection for user ${event.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to create projection for user ${event.userId}: ${error.message}`,
        error.stack,
      );
      // In production, you might want to:
      // - Retry the operation
      // - Store in a dead letter queue
      // - Send alerts
      throw error;
    }
  }
}

/**
 * Handles UserLoginSuccessEvent to update login statistics
 */
@EventsHandler(UserLoginSuccessEvent)
export class UserLoginSuccessProjectionHandler implements IEventHandler<UserLoginSuccessEvent> {
  private readonly logger = new Logger(UserLoginSuccessProjectionHandler.name);

  constructor(private readonly projectionService: UserProjectionService) {}

  async handle(event: UserLoginSuccessEvent): Promise<void> {
    this.logger.log(`Handling UserLoginSuccessEvent for user ${event.userId}`);

    try {
      await this.projectionService.updateLoginInfo(event.userId, {
        lastLoginAt: event.occurredAt,
        resetFailedAttempts: true,
      });

      this.logger.log(`Updated login projection for user ${event.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to update login projection for user ${event.userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

/**
 * Additional projection handlers can be added here:
 * - EmailVerificationSuccessProjectionHandler
 * - UserProfileUpdatedProjectionHandler
 * - UserStatusChangedProjectionHandler
 * - KycVerificationCompletedProjectionHandler
 * etc.
 */

