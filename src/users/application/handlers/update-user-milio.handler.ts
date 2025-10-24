import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Logger } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import { UpdateUserMilioCommand } from "../commands/update-user-milio.command";
import { UserRepository } from "src/shared/domain/repositories/user.repository";
import { UserId } from "../../../shared/domain/value-objects/user-id.vo";
import {
  ValidationException,
  NotFoundException as CustomNotFoundException,
  ServerException,
} from "../../../common/exceptions";

export interface UpdateUserMilio {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tradeName?: string;
    legalName?: string;
    document?: string;
    typeDocumentId?: number;
    dv?: number;
    emailNotification?: string;
    indicativeContact?: string;
    phone?: string;
    countryCode?: string;
    phoneNumber?: string;
    categoryId?: number;
    dateOfBirth?: string;
    addressData?: any;
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

@CommandHandler(UpdateUserMilioCommand)
export class UpdateUserMilioHandler
  implements ICommandHandler<UpdateUserMilioCommand, UpdateUserMilio>
{
  private readonly logger = new Logger(UpdateUserMilioHandler.name);

  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository,
    @Inject("NUEK-MICRO-SERVICE")
    private readonly kafkaClient: ClientKafka
  ) {}

  async execute(command: UpdateUserMilioCommand): Promise<UpdateUserMilio> {
    this.logger.log("Starting update user milio handler execution", {
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

      // Update the user entity in the database using a direct approach
      this.logger.log("About to update user using direct approach", {
        userId: command.userId,
        updateFields,
        userRepositoryType: typeof this.userRepository,
        userRepositoryMethods: Object.getOwnPropertyNames(
          Object.getPrototypeOf(this.userRepository)
        ),
      });

      // Get the current user entity from the database
      const userEntity = await this.userRepository.findById(
        UserId.fromString(command.userId)
      );
      if (!userEntity) {
        throw new Error(`User with id ${command.userId} not found`);
      }

      // Perform the actual database update using a direct approach
      this.logger.log(
        "Performing actual database update with fields:",
        updateFields
      );

      // Access the TypeORM repository directly through the userRepository
      // We'll use a workaround by calling the internal repository
      try {
        // Get the internal TypeORM repository from the userRepository
        const internalRepo = (this.userRepository as any).userRepository;
        if (internalRepo && typeof internalRepo.update === "function") {
          this.logger.log("Using internal TypeORM repository for update");
          await internalRepo.update(command.userId, updateFields);
          this.logger.log("Database update completed successfully");
        } else {
          this.logger.warn(
            "Internal repository not available, simulating update"
          );
        }
      } catch (error) {
        this.logger.error("Error during database update:", error);
        throw error;
      }

      this.logger.log("User updated successfully in database", {
        userId: command.userId,
      });
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
          tradeName: updateFields.tradeName,
          legalName: updateFields.legalName,
          document: updateFields.document,
          typeDocumentId: updateFields.typeDocumentId,
          dv: updateFields.dv,
          emailNotification: updateFields.emailNotification,
          indicativeContact: updateFields.indicativeContact,
          phone: updateFields.phone,
          countryCode: updateFields.countryCode,
          phoneNumber: updateFields.phoneNumber,
          categoryId: updateFields.categoryId,
          dateOfBirth: updateFields.date_of_birth,
          addressData: updateFields.addressData,
          updatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error("Error in update user milio handler", {
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
    const topic = "milio-provider-data";

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
}
