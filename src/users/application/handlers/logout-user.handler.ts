import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { ServerException } from '../../../common/exceptions';
import { LogoutUserCommand } from '../commands/logout-user.command';
import { TokenBlacklistService } from '../services/token-blacklist.service';

// Importar eventos
import {
  UserLogoutEvent
} from '../../domain/events';

@Injectable()
@CommandHandler(LogoutUserCommand)
export class LogoutUserHandler implements ICommandHandler<LogoutUserCommand> {
  constructor(
    private readonly eventBus: EventBus,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async execute(command: LogoutUserCommand): Promise<any> {
    try {
      // Si se proporciona un token, agregarlo a la lista negra
      if (command.logoutData?.token) {
        this.tokenBlacklistService.addToBlacklist(command.logoutData.token);
      }

      // Emitir evento de logout
      this.eventBus.publish(
        new UserLogoutEvent(
          command.userId,
          command.email,
          command.logoutData
        )
      );

      return {
        success: true,
        message: 'Sesión cerrada exitosamente',
        data: {
          userId: command.userId,
          email: command.email,
        },
        statusCode: 200,
      };
    } catch (error) {
      throw new ServerException('Error durante el logout. Intente nuevamente.');
    }
  }
}
