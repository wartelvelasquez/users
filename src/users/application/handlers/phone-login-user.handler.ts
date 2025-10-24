import { Injectable, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { 
  AuthenticationException 
} from '../../../common/exceptions';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from 'src/shared/domain/repositories/user.repository';
import { PhoneLoginUserCommand } from '../commands/phone-login-user.command';
import { Email } from '../../domain/value-objects/email.vo';
import * as bcrypt from 'bcrypt';

// Importar eventos
import {
  PhoneLoginSuccessEvent,
  PhoneLoginFailedEvent
} from '../../domain/events';

@Injectable()
@CommandHandler(PhoneLoginUserCommand)
export class PhoneLoginUserHandler implements ICommandHandler<PhoneLoginUserCommand> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: PhoneLoginUserCommand): Promise<any> {
    try {
      // Find user by phone number
      const user = await this.userRepository.findByPhoneNumber(command.phone);
      
      if (!user) {
        throw new AuthenticationException('Credenciales inválidas. Verifique su número de teléfono y contraseña.');
      }

      // Check if user is active
      if (!user.isActive()) {
        throw new AuthenticationException('Su cuenta está desactivada. Contacte al administrador.');
      }

      // Authenticate against local password comparison
      const isPasswordValid = await this.comparePassword(command.password, user.password.value);
      if (!isPasswordValid) {
        throw new AuthenticationException('Credenciales inválidas. Verifique su número de teléfono y contraseña.');
      }

      // Generate tokens
      const accessTokenExpiry = this.configService.get('JWT_EXPIRES_IN') || '1h';
      const refreshTokenExpiry = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d';

      const accessToken = this.jwtService.sign(
        { sub: user.id.value, email: user.email.value, type: 'access' },
        { expiresIn: accessTokenExpiry }
      );

      // Update last login
      await this.userRepository.updateLastLogin(user.id, new Date());

      const response = {
        success: true,
        message: 'Inicio de sesión por teléfono exitoso',
        data: {
          user: {
            id: user.id.value,
            email: user.email.value,
            firstName: user.firstName,
            lastName: user.lastName,
            isActive: user.isActive(),
            isEmailVerified: user.status === 'ACCEPTED',
          },
          accessToken,
        },
        statusCode: 200,
      };

      // Emitir evento de login exitoso
      const loginData = { phone: command.phone, password: '***' };
      
      this.eventBus.publish(
        new PhoneLoginSuccessEvent(
          user.id.value,
          command.phone,
          loginData
        )
      );

      return response;
    } catch (error) {
      // Emitir evento de fallo en login
      const loginData = { phone: command.phone, password: '***' };
      
      this.eventBus.publish(
        new PhoneLoginFailedEvent(
          command.phone,
          loginData,
          error.message
        )
      );

      if (error instanceof AuthenticationException) {
        throw error;
      }
      throw new AuthenticationException('Error durante la autenticación. Intente nuevamente.');
    }
  }

  private async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
