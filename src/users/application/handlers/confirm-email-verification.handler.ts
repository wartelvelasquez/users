import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { ConfirmEmailVerificationCommand } from '../commands/confirm-email-verification.command';
import { UserRepository } from 'src/shared/domain/repositories/user.repository';
import { UserId } from 'src/shared/domain/value-objects/user-id.vo';
import { UserStatus } from 'src/shared/domain/entities/user.entity';

// Importar eventos
import {
  EmailVerificationSuccessEvent,
  EmailVerificationFailedEvent
} from '../../domain/events';

export interface ConfirmEmailVerificationResult {
  success: boolean;
  message: string;
  userId?: string;
  validationErrors?: {
    isValid: boolean;
    errors: Array<{
      field: string;
      message: string;
      code: string;
    }>;
  };
}

@CommandHandler(ConfirmEmailVerificationCommand)
export class ConfirmEmailVerificationHandler implements ICommandHandler<ConfirmEmailVerificationCommand, ConfirmEmailVerificationResult> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ConfirmEmailVerificationCommand): Promise<ConfirmEmailVerificationResult> {
    try {
      // Validar el formato del token
      if (!command.isValidFormat()) {
        return {
          success: false,
          message: 'Invalid verification token format',
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: 'token',
                message: 'Invalid verification token format',
                code: 'INVALID_TOKEN_FORMAT'
              }
            ]
          }
        };
      }

      // Extraer el ID del usuario del token
      let userId: string;
      try {
        userId = command.getUserId();
      } catch (error) {
        return {
          success: false,
          message: 'Invalid token: cannot extract user ID',
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: 'token',
                message: 'Invalid token: cannot extract user ID',
                code: 'INVALID_TOKEN_USER_ID'
              }
            ]
          }
        };
      }

      // Buscar el usuario en la base de datos
      const userIdVo = UserId.fromString(userId);
      const user = await this.userRepository.findById(userIdVo);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: 'token',
                message: 'User not found',
                code: 'USER_NOT_FOUND'
              }
            ]
          }
        };
      }

      // Verificar si el email ya está verificado (status ACCEPTED)
      if (user.status === UserStatus.ACCEPTED) {
        return {
          success: false,
          message: 'Email is already verified',
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: 'email',
                message: 'Email is already verified',
                code: 'EMAIL_ALREADY_VERIFIED'
              }
            ]
          }
        };
      }

      // Verificar el usuario (cambiar status a 'ACCEPTED')
      user.verifyEmail();
      
      // Guardar el usuario verificado
      await this.userRepository.save(user);

      const result = {
        success: true,
        message: 'Email verified successfully',
        userId: user.id.value,
      };

      // Emitir evento de verificación exitosa
      this.eventBus.publish(
        new EmailVerificationSuccessEvent(
          user.id.value,
          user.email.value,
          command.token
        )
      );

      return result;

    } catch (error) {
      // Emitir evento de fallo en verificación
      this.eventBus.publish(
        new EmailVerificationFailedEvent(
          command.token,
          error.message || 'Verification failed'
        )
      );

      // Manejar errores de validación
      if (error instanceof Error) {
        if (error.message.includes('Verification token is required')) {
          return {
            success: false,
            message: 'Verification token is required',
            validationErrors: {
              isValid: false,
              errors: [
                {
                  field: 'token',
                  message: 'Verification token is required',
                  code: 'TOKEN_REQUIRED'
                }
              ]
            }
          };
        }

        if (error.message.includes('Invalid token format')) {
          return {
            success: false,
            message: 'Invalid token format',
            validationErrors: {
              isValid: false,
              errors: [
                {
                  field: 'token',
                  message: 'Invalid token format',
                  code: 'INVALID_TOKEN_FORMAT'
                }
              ]
            }
          };
        }
      }

      // Error genérico
      return {
        success: false,
        message: 'Email verification failed due to an unexpected error',
        validationErrors: {
          isValid: false,
          errors: [
            {
              field: 'token',
              message: 'Email verification failed due to an unexpected error',
              code: 'VERIFICATION_FAILED'
            }
          ]
        }
      };
    }
  }
}
