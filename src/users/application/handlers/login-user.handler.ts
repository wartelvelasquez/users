import { Injectable, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { 
  BusinessException, 
  ValidationException, 
  AuthenticationException, 
  ServerException 
} from '../../../common/exceptions';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from 'src/shared/domain/repositories/user.repository';
import { LoginUserCommand } from '../commands/login-user.command';
import { Email } from '../../../shared/domain/value-objects/email.vo';
import * as bcrypt from 'bcrypt';

// Importar eventos
import {
  UserLoginSuccessEvent,
  UserLoginFailedEvent
} from '../../domain/events';

@Injectable()
@CommandHandler(LoginUserCommand)
export class LoginUserHandler implements ICommandHandler<LoginUserCommand> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LoginUserCommand): Promise<any> {
    try {
      // Find user by email
      const loginEmail = Email.fromString(command.email);
      console.log('🔥 LoginUserHandler.login called with:', loginEmail);
      const user = await this.userRepository.findByEmail(loginEmail);
      console.log('🔥 LoginUserHandler.login user:', user);
      
      if (!user) {
        throw new AuthenticationException('Credenciales inválidas. Verifique su email y contraseña.');
      }

      // Check if user is active
      if (!user.isActive()) {
        throw new AuthenticationException('Su cuenta está desactivada. Contacte al administrador.');
      }

      // Authenticate against local password comparison
      const isPasswordValid = await this.comparePassword(command.password, user.password.value);
      if (!isPasswordValid) {
        throw new AuthenticationException('Credenciales inválidas. Verifique su email y contraseña.');
      }

      // Generate tokens
      const accessTokenExpiry = this.configService.get('JWT_EXPIRES_IN') || '1h';

      const accessToken = this.jwtService.sign(
        { sub: user.id.value, email: user.email.value, type: 'access' },
        { expiresIn: accessTokenExpiry }
      );

      // Update last login
      await this.userRepository.updateLastLogin(user.id, new Date());

      const response = {
        success: true,
        message: 'User login successful',
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
      this.eventBus.publish(
        new UserLoginSuccessEvent(
          user.id.value,
          command.email,
          { email: command.email, password: '***' }
        )
      );

      return response;
    } catch (error) {
      // Emitir evento de fallo en login
      this.eventBus.publish(
        new UserLoginFailedEvent(
          command.email,
          { email: command.email, password: '***' },
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
