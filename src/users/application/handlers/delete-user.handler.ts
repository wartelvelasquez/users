import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { DeleteUserCommand } from '../commands/delete-user.command';
import { UserRepository } from '../../../shared/domain/repositories/user.repository';
import { UserId } from '../../../shared/domain/value-objects/user-id.vo';
import { UserStatus } from '../../../shared/domain/entities/user.entity';
import {
  ValidationException,
  NotFoundException as CustomNotFoundException,
} from '../../../common/exceptions';
import { UserDeletedEvent } from '../../domain/events/user-deleted.event';
import { EventStoreService } from '../../../shared/infrastructure/event-store/event-store.service';

export interface DeleteUserResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    email: string;
    status: string;
    deletedAt: string;
    hardDelete?: boolean;
  };
  validationErrors?: {
    isValid: boolean;
    errors: Array<{
      field: string;
      message: string;
      code: string;
    }>;
  };
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler
  implements ICommandHandler<DeleteUserCommand, DeleteUserResponse>
{
  private readonly logger = new Logger(DeleteUserHandler.name);

  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
    private readonly eventStore: EventStoreService,
  ) {}

  async execute(command: DeleteUserCommand): Promise<DeleteUserResponse> {
    this.logger.log('Starting delete user handler execution', {
      userId: command.userId,
      hardDelete: command.hardDelete,
    });

    try {
      // Validate userId
      if (!command.userId || command.userId.trim().length === 0) {
        this.logger.warn('User ID validation failed: empty or null');
        return {
          success: false,
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: 'userId',
                message: 'User ID is required',
                code: 'USER_ID_REQUIRED',
              },
            ],
          },
        };
      }

      this.logger.log('Looking for user by ID', { userId: command.userId });

      // Find user by ID
      const user = await this.userRepository.findById(
        UserId.fromString(command.userId)
      );
      
      if (!user) {
        this.logger.warn('User not found', { userId: command.userId });
        return {
          success: false,
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: 'userId',
                message: 'User not found',
                code: 'USER_NOT_FOUND',
              },
            ],
          },
        };
      }

      this.logger.log('User found successfully', {
        userId: command.userId,
        email: user.email.value,
      });

      // Check if hard delete is requested
      if (command.hardDelete) {
        this.logger.warn('Hard delete requested but not implemented yet', {
          userId: command.userId,
        });
        // TODO: Implement hard delete if needed
        return {
          success: false,
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: 'hardDelete',
                message: 'Hard delete is not supported yet',
                code: 'HARD_DELETE_NOT_SUPPORTED',
              },
            ],
          },
        };
      }

      // Perform soft delete
      this.logger.log('Performing soft delete', {
        userId: command.userId,
      });

      // Get the internal TypeORM repository from the userRepository
      const internalRepo = (this.userRepository as any).userRepository;
      if (!internalRepo || typeof internalRepo.update !== 'function') {
        this.logger.error('Internal repository not available');
        throw new Error('Database update failed: internal repository not available');
      }

      // Update user with soft delete fields
      const now = new Date();
      await internalRepo.update(command.userId, {
        deletedAt: now,
        status: UserStatus.BLOCKED,
        updatedAt: now,
      });

      this.logger.log('User soft deleted successfully', {
        userId: command.userId,
        deletedAt: now.toISOString(),
      });

      // Get updated user data
      const deletedUser = await this.userRepository.findById(
        UserId.fromString(command.userId)
      );

      if (!deletedUser) {
        this.logger.error('User not found after deletion', {
          userId: command.userId,
        });
        return {
          success: false,
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: 'userId',
                message: 'User not found after deletion',
                code: 'USER_NOT_FOUND_AFTER_DELETE',
              },
            ],
          },
        };
      }

      this.logger.log('Soft delete completed successfully', {
        userId: command.userId,
        status: deletedUser.status,
      });

      // Publish domain event for projection sync
      const userDeletedEvent = new UserDeletedEvent(
        command.userId,
        deletedUser.email.value,
        now,
        command.hardDelete,
      );
      
      // Store event in event store for projection sync
      const latestVersion = await this.eventStore.getLatestVersion(command.userId);
      await this.eventStore.appendEvent(
        command.userId,
        'User',
        userDeletedEvent,
        latestVersion + 1,
      );

      // Also publish to event bus for real-time processing
      this.eventBus.publish(userDeletedEvent);

      this.logger.log('User deleted event stored and published', {
        userId: command.userId,
        eventType: userDeletedEvent.getEventType(),
        version: latestVersion + 1,
      });

      return {
        success: true,
        message: 'User deleted successfully (soft delete)',
        data: {
          id: deletedUser.id.value,
          email: deletedUser.email.value,
          status: deletedUser.status,
          deletedAt: now.toISOString(),
          hardDelete: false,
        },
      };
    } catch (error) {
      this.logger.error('Error in delete user handler', {
        error: error.message,
        stack: error.stack,
        userId: command.userId,
      });

      // Handle specific validation errors
      if (error instanceof ValidationException) {
        return {
          success: false,
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: 'validation',
                message: error.message,
                code: 'VALIDATION_ERROR',
              },
            ],
          },
        };
      }

      if (error instanceof CustomNotFoundException) {
        return {
          success: false,
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: 'userId',
                message: 'User not found',
                code: 'USER_NOT_FOUND',
              },
            ],
          },
        };
      }

      // Generic error
      return {
        success: false,
        validationErrors: {
          isValid: false,
          errors: [
            {
              field: 'system',
              message: 'Error deleting user',
              code: 'DELETE_FAILED',
            },
          ],
        },
      };
    }
  }
}


