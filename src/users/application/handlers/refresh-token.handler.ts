import { Injectable, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { 
  AuthenticationException,
  NotFoundException as CustomNotFoundException
} from '../../../common/exceptions';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from 'src/shared/domain/repositories/user.repository';
import { RefreshTokenCommand } from '../commands/refresh-token.command';
import { UserId } from '../../../shared/domain/value-objects/user-id.vo';

// Importar eventos
import {
  TokenRefreshSuccessEvent,
  TokenRefreshFailedEvent
} from '../../domain/events';

@Injectable()
@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<any> {
    try {
      console.log('🔍 Attempting to verify refresh token:', command.refreshToken.substring(0, 50) + '...');
      const payload = this.jwtService.verify(command.refreshToken);
      console.log('✅ Token verified successfully. Payload:', payload);
      
      if (payload.type !== 'refresh') {
        console.log('❌ Token type is not refresh:', payload.type);
        throw new AuthenticationException('Token de actualización inválido');
      }
      console.log('✅ Token type is refresh');

      const userIdVo = UserId.fromString(payload.sub);
      const user = await this.userRepository.findById(userIdVo);
      if (!user) {
        throw new CustomNotFoundException('Usuario no encontrado');
      }

      if (!user.isActive()) {
        throw new AuthenticationException('Su cuenta está desactivada');
      }

      const accessTokenExpiry = this.configService.get('JWT_EXPIRES_IN') || '1h';
      const newAccessToken = this.jwtService.sign(
        { sub: user.id.value, email: user.email.value, type: 'access' },
        { expiresIn: accessTokenExpiry }
      );

      // Convert time string to seconds for the response
      const expiresInSeconds = accessTokenExpiry === '1h' ? 3600 : 
                              accessTokenExpiry === '30m' ? 1800 :
                              accessTokenExpiry === '15m' ? 900 :
                              parseInt(accessTokenExpiry) || 3600;

      const response = {
        success: true,
        message: 'Token actualizado exitosamente',
        data: {
          accessToken: newAccessToken,
          expiresIn: expiresInSeconds,
        },
        statusCode: 200,
      };

      // Emitir evento de refresh exitoso
      this.eventBus.publish(
        new TokenRefreshSuccessEvent(
          user.id.value,
          user.email.value,
          { refreshToken: command.refreshToken }
        )
      );

      return response;
    } catch (error) {
      console.log('❌ Error in refreshToken method:', error.message);
      console.log('❌ Full error:', error);
      
      // Emitir evento de fallo en refresh
      this.eventBus.publish(
        new TokenRefreshFailedEvent(
          command.refreshToken,
          { refreshToken: command.refreshToken },
          error.message
        )
      );
      
      if (error instanceof AuthenticationException || error instanceof CustomNotFoundException) {
        throw error;
      }
      throw new AuthenticationException('Token de actualización inválido o expirado');
    }
  }
}
