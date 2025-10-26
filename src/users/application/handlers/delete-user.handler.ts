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
    this.logger.log('Iniciando ejecución del handler de eliminación de usuario', {
      userId: command.userId,
      hardDelete: command.hardDelete,
    });

    try {
      // Validar ID de usuario
      if (!this.isValidUserId(command.userId)) {
        return this.createValidationError('userId', 'El ID de usuario es requerido', 'USER_ID_REQUIRED');
      }

      // Buscar usuario por ID
      const user = await this.findUserById(command.userId);
      if (!user) {
        return this.createValidationError('userId', 'Usuario no encontrado', 'USER_NOT_FOUND');
      }

      // Verificar si se solicita eliminación permanente
      if (command.hardDelete) {
        return this.handleHardDeleteNotSupported(command.userId);
      }

      // Realizar eliminación suave
      const now = new Date();
      await this.performSoftDelete(command.userId, now);

      // Obtener datos actualizados del usuario
      const deletedUser = await this.findUserById(command.userId);
      if (!deletedUser) {
        return this.createValidationError('userId', 'Usuario no encontrado después de la eliminación', 'USER_NOT_FOUND_AFTER_DELETE');
      }

      // Publicar evento de dominio para sincronización de proyección
      await this.publishUserDeletedEvent(command.userId, deletedUser.email.value, now, command.hardDelete);

      this.logger.log('Eliminación suave completada exitosamente', {
        userId: command.userId,
        status: deletedUser.status,
      });

      return {
        success: true,
        message: 'Usuario eliminado exitosamente (eliminación suave)',
        data: {
          id: deletedUser.id.value,
          email: deletedUser.email.value,
          status: deletedUser.status,
          deletedAt: now.toISOString(),
          hardDelete: false,
        },
      };
    } catch (error) {
      this.logger.error('Error en el handler de eliminación de usuario', {
        error: error.message,
        stack: error.stack,
        userId: command.userId,
      });

      // Manejar errores de validación específicos
      if (error instanceof ValidationException) {
        return this.createValidationError('validation', error.message, 'VALIDATION_ERROR');
      }

      if (error instanceof CustomNotFoundException) {
        return this.createValidationError('userId', 'Usuario no encontrado', 'USER_NOT_FOUND');
      }

      // Error genérico
      return this.createValidationError('system', 'Error eliminando usuario', 'DELETE_FAILED');
    }
  }

  /**
   * Valida que el ID de usuario sea válido
   */
  private isValidUserId(userId: string): boolean {
    return !!userId && userId.trim().length > 0;
  }

  /**
   * Busca un usuario por ID
   */
  private async findUserById(userId: string) {
    this.logger.log('Buscando usuario por ID', { userId });
    return await this.userRepository.findById(UserId.fromString(userId));
  }

  /**
   * Maneja el caso cuando se solicita eliminación permanente no soportada
   */
  private handleHardDeleteNotSupported(userId: string): DeleteUserResponse {
    this.logger.warn('Eliminación permanente solicitada pero no implementada', { userId });
    return this.createValidationError('hardDelete', 'La eliminación permanente no está soportada', 'HARD_DELETE_NOT_SUPPORTED');
  }

  /**
   * Realiza la eliminación suave del usuario
   */
  private async performSoftDelete(userId: string, timestamp: Date): Promise<void> {
    this.logger.log('Realizando eliminación suave', { userId });

    // Obtener el repositorio interno de TypeORM desde el userRepository
    const internalRepo = (this.userRepository as any).userRepository;
    if (!internalRepo || typeof internalRepo.update !== 'function') {
      this.logger.error('Repositorio interno no disponible');
      throw new Error('Error en actualización de base de datos: repositorio interno no disponible');
    }

    await internalRepo.update(userId, {
      deletedAt: timestamp,
      status: UserStatus.BLOCKED,
      updatedAt: timestamp,
    });

    this.logger.log('Usuario eliminado suavemente exitosamente', {
      userId,
      deletedAt: timestamp.toISOString(),
    });
  }

  /**
   * Publica el evento de usuario eliminado
   */
  private async publishUserDeletedEvent(
    userId: string,
    email: string,
    timestamp: Date,
    hardDelete: boolean,
  ): Promise<void> {
    const userDeletedEvent = new UserDeletedEvent(userId, email, timestamp, hardDelete);
    
    // Almacenar evento en el event store para sincronización de proyección
    const latestVersion = await this.eventStore.getLatestVersion(userId);
    await this.eventStore.appendEvent(
      userId,
      'User',
      userDeletedEvent,
      latestVersion + 1,
    );

    // También publicar al event bus para procesamiento en tiempo real
    this.eventBus.publish(userDeletedEvent);

    this.logger.log('Evento de usuario eliminado almacenado y publicado', {
      userId,
      eventType: userDeletedEvent.getEventType(),
      version: latestVersion + 1,
    });
  }

  /**
   * Crea un error de validación estandarizado
   */
  private createValidationError(
    field: string,
    message: string,
    code: string,
  ): DeleteUserResponse {
    return {
      success: false,
      validationErrors: {
        isValid: false,
        errors: [
          {
            field,
            message,
            code,
          },
        ],
      },
    };
  }
}


