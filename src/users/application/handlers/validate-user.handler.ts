import { Injectable, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { 
  NotFoundException as CustomNotFoundException,
  ServerException 
} from '../../../common/exceptions';
import { UserRepository } from 'src/shared/domain/repositories/user.repository';
import { ValidateUserCommand } from '../commands/validate-user.command';
import { UserId } from '../../../shared/domain/value-objects/user-id.vo';

// Importar eventos
import {
  UserValidationSuccessEvent,
  UserValidationFailedEvent
} from '../../domain/events';

@Injectable()
@CommandHandler(ValidateUserCommand)
export class ValidateUserHandler implements ICommandHandler<ValidateUserCommand> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ValidateUserCommand): Promise<any> {
    try {
      const userIdVo = UserId.fromString(command.userId);
      const user = await this.userRepository.findById(userIdVo);
      
      if (!user || !user.isActive()) {
        throw new CustomNotFoundException('Usuario no encontrado o inactivo');
      }
      
      const response = {
        success: true,
        message: 'Usuario validado exitosamente',
        data: {
          user: {
            id: user.id.value,
            email: user.email.value,
            firstName: user.firstName,
            lastName: user.lastName,
            isActive: user.isActive(),
            isEmailVerified: user.status === 'ACCEPTED',
          },
        },
        statusCode: 200,
      };

      // Emitir evento de validación exitosa
      this.eventBus.publish(
        new UserValidationSuccessEvent(
          command.userId,
          { userId: command.userId }
        )
      );

      return response;
    } catch (error) {
      // Emitir evento de fallo en validación
      this.eventBus.publish(
        new UserValidationFailedEvent(
          command.userId,
          { userId: command.userId },
          error.message
        )
      );

      if (error instanceof CustomNotFoundException) {
        throw error;
      }
      throw new ServerException('Error durante la validación del usuario');
    }
  }
}
