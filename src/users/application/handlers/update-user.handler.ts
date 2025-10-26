import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { Inject, Logger } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import { UpdateUserCommand } from "../commands/update-user.command";
import { UserRepository } from "src/shared/domain/repositories/user.repository";
import { UserId } from "../../../shared/domain/value-objects/user-id.vo";
import {
  ValidationException,
  NotFoundException as CustomNotFoundException,
  ServerException,
} from "../../../common/exceptions";
import { ProfileUpdatedEvent } from "../../domain/events/profile-updated.event";
import { EventStoreService } from "../../../shared/infrastructure/event-store/event-store.service";
import { DirectProjectionService } from "../../../shared/infrastructure/projections/direct-projection.service";

export interface UpdateUser {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    updatedAt: string;
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

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler
  implements ICommandHandler<UpdateUserCommand, UpdateUser>
{
  private readonly logger = new Logger(UpdateUserHandler.name);

  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository,
    @Inject("USER-MICRO-SERVICE")
    private readonly kafkaClient: ClientKafka,
    private readonly eventBus: EventBus,
    private readonly eventStore: EventStoreService,
    private readonly directProjectionService: DirectProjectionService,
  ) {}

  async execute(command: UpdateUserCommand): Promise<UpdateUser> {
    this.logger.log("Starting update user handler execution", {
      userId: command.userId,
    });

    try {
      // Validate userId
      if (!command.userId || command.userId.trim().length === 0) {
        this.logger.warn("User ID validation failed: empty or null");
        return {
          success: false,
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: "userId",
                message: "User ID is required",
                code: "USER_ID_REQUIRED",
              },
            ],
          },
        };
      }

      this.logger.log("Looking for user by ID", { userId: command.userId });

      // Find user by ID
      const user = await this.userRepository.findById(
        UserId.fromString(command.userId)
      );
      if (!user) {
        this.logger.warn("User not found", { userId: command.userId });
        return {
          success: false,
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: "userId",
                message: "User not found",
                code: "USER_NOT_FOUND",
              },
            ],
          },
        };
      }

      this.logger.log("User found successfully", {
        userId: command.userId,
        email: user.email.value,
      });

      // Get update fields from command
      const updateFields = command.getUpdateFields();
      this.logger.log("Update fields extracted", {
        fieldsCount: Object.keys(updateFields).length,
        fields: updateFields,
      });

      // Check if there are any fields to update
      if (Object.keys(updateFields).length === 0) {
        this.logger.warn("No fields provided for update");
        return {
          success: false,
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: "updateData",
                message: "No fields provided for update",
                code: "NO_UPDATE_FIELDS",
              },
            ],
          },
        };
      }

      this.logger.log("Updating user in database", {
        userId: command.userId,
        updateFields,
      });

      // Use the repository's updateProfile method to update write database
      await this.userRepository.updateProfile(
        UserId.fromString(command.userId),
        updateFields
      );

      this.logger.log("User updated successfully in write database", {
        userId: command.userId,
      });

      // Update read database projection directly
      await this.directProjectionService.updateUserProfile(command.userId, updateFields);

      this.logger.log("User projection updated successfully in read database", {
        userId: command.userId,
      });

      // Emitir evento de dominio para otros sistemas (opcional)
      await this.publishProfileUpdatedEvent(command.userId, updateFields);

      this.logger.log("Emitting user update event to Kafka", {
        userId: command.userId,
      });
      // Emitir evento a Kafka con la estructura original del DTO
      const eventPayload = command.getEventPayload();
      await this.emitUserUpdateEvent(eventPayload);

      // Get updated user data
      this.logger.log("Fetching updated user data", { userId: command.userId });
      const updatedUser = await this.userRepository.findById(
        UserId.fromString(command.userId)
      );

      if (!updatedUser) {
        this.logger.error("User not found after update", {
          userId: command.userId,
        });
        return {
          success: false,
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: "userId",
                message: "User not found after update",
                code: "USER_NOT_FOUND_AFTER_UPDATE",
              },
            ],
          },
        };
      }

      this.logger.log("Update completed successfully", {
        userId: command.userId,
        updatedFields: Object.keys(updateFields),
      });

      return {
        success: true,
        message: "User updated successfully",
        data: {
          id: updatedUser.id.value,
          email: updatedUser.email.value,
          firstName: updatedUser.firstName.value,
          lastName: updatedUser.lastName.value,
          phone: updateFields.phone,
          updatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error("Error in update user handler", {
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
                field: "validation",
                message: error.message,
                code: "VALIDATION_ERROR",
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
                field: "userId",
                message: "User not found",
                code: "USER_NOT_FOUND",
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
              field: "system",
              message: "Error updating user profile",
              code: "UPDATE_FAILED",
            },
          ],
        },
      };
    }
  }

  /**
   * Emite un evento a Kafka para notificar la actualización del usuario
   */
  private async emitUserUpdateEvent(eventPayload: any): Promise<void> {
    const topic = "user-provider-data";

    try {
      this.logger.log(
        `Emitting user update event to Kafka`
      );

      this.logger.log(
        "User update event payload:",
        JSON.stringify(eventPayload, null, 2)
      );

      // Emitir el evento a Kafka
      const emit$ = this.kafkaClient.emit(topic, eventPayload);

      // Esperar a que el evento se emita con timeout
      const KAFKA_EMIT_TIMEOUT_MS = 180000;
      const emitPromise = lastValueFrom(emit$);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Kafka emit timed out")),
          KAFKA_EMIT_TIMEOUT_MS
        )
      );

      await Promise.race([emitPromise, timeoutPromise]);

      this.logger.log(
        `User update event emitted successfully to topic: ${topic}`
      );
    } catch (error) {
      this.logger.error(
        `Error emitting user update event: ${error.message}`,
        error.stack
      );
      // No lanzamos el error para no interrumpir el flujo principal
      // Solo lo logueamos
    }
  }

  /**
   * Publica el evento de perfil actualizado
   */
  private async publishProfileUpdatedEvent(
    userId: string,
    changes: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
  ): Promise<void> {
    try {
      this.logger.log('Creating ProfileUpdatedEvent', {
        userId,
        changes,
      });

      const profileUpdatedEvent = new ProfileUpdatedEvent(userId, changes);
      
      // Almacenar evento en el event store para sincronización de proyección
      const latestVersion = await this.eventStore.getLatestVersion(userId);
      
      this.logger.log('Appending event to event store', {
        userId,
        eventType: profileUpdatedEvent.getEventType(),
        version: latestVersion + 1,
      });

      await this.eventStore.appendEvent(
        userId,
        'User',
        profileUpdatedEvent,
        latestVersion + 1,
      );

      // También publicar al event bus para procesamiento en tiempo real
      this.eventBus.publish(profileUpdatedEvent);

      this.logger.log('✅ Profile updated event stored and published successfully', {
        userId,
        eventType: profileUpdatedEvent.getEventType(),
        version: latestVersion + 1,
        changes,
      });
    } catch (error) {
      this.logger.error('❌ Failed to publish profile updated event', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      // No lanzamos el error para no interrumpir el flujo principal
      // Solo lo logueamos para debugging
    }
  }
}
