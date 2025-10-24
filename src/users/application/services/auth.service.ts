import { Injectable, Inject } from '@nestjs/common';
import { 
  BusinessException, 
  ValidationException, 
  AuthenticationException, 
  NotFoundException as CustomNotFoundException,
  ConflictException,
  ServerException
} from '../../../common/exceptions';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { UserRepository } from 'src/shared/domain/repositories/user.repository';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { PhoneLoginDto } from '../dtos/phone-login.dto';
import { LoginMobileDto } from '../dtos/login-mobile.dto';
import { RegisterMobileDto } from '../dtos/register-mobile.dto';
import { RegisterUserCommand } from '../commands/register-user.command';
import { ConfirmEmailVerificationCommand } from '../commands/confirm-email-verification.command';
import { LoginUserCommand } from '../commands/login-user.command';
import { PhoneLoginUserCommand } from '../commands/phone-login-user.command';
import { LoginMobileUserCommand } from '../commands/login-mobile-user.command';
import { RegisterMobileUserCommand } from '../commands/register-mobile-user.command';
import { ValidateUserCommand } from '../commands/validate-user.command';
import { RefreshTokenCommand } from '../commands/refresh-token.command';
import { LogoutUserCommand } from '../commands/logout-user.command';
import { TokenBlacklistService } from './token-blacklist.service';
import { Email } from '../../domain/value-objects/email.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import * as bcrypt from 'bcrypt';

// Importar eventos
import {
  UserRegisteredEvent,
  UserRegistrationFailedEvent
} from '../../domain/events';

@Injectable()
export class AuthService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async register(registerDto: RegisterDto): Promise<any> {
    try {     
      const command = new RegisterUserCommand(
        registerDto.email,
        registerDto.password,
        registerDto.firstName,
        registerDto.lastName,
        registerDto.phone,
        true, // acceptTerms
        false // marketingConsent
      );

      const result = await this.commandBus.execute(command);

      // Check if registration was successful
      if (!result.success) {
        // If there are validation errors, throw ValidationException with details
        if (result.validationErrors && !result.validationErrors.isValid) {
          const errorMessages = result.validationErrors.errors.map(error => error.message).join(', ');
          throw new ValidationException(
            'Error en los datos de registro: ' + errorMessages,
            result.validationErrors.errors
          );
        }
        
        // If there's an auth response with a specific message, use that
        if (result.authResponse && result.authResponse.message) {
          throw new ConflictException(result.authResponse.message);
        }
        
        // Generic error fallback
        throw new BusinessException('Error durante el registro del usuario');
      }

      const response = {
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          userId: result.userId,
        },
        statusCode: 201,
      };

      // Emitir evento de registro exitoso
      this.eventBus.publish(
        new UserRegisteredEvent(
          result.userId,
          registerDto.email,
          {
            email: registerDto.email,
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            phone: registerDto.phone,
            status: 'ACCEPTED',
          }
        )
      );

      return response;
    } catch (error) {
      // Emitir evento de fallo en registro
      this.eventBus.publish(
        new UserRegistrationFailedEvent(
          registerDto.email,
          registerDto,
          error.message
        )
      );

      if (error instanceof BusinessException || error instanceof ValidationException || error instanceof ConflictException) {
        throw error;
      }
      throw new ServerException('Error interno durante el registro. Intente nuevamente.');
    }
  }

  async registerMobile(registerMobileDto: RegisterMobileDto): Promise<any> {
    try {
      const command = new RegisterMobileUserCommand(
        registerMobileDto.email || '',
        registerMobileDto.password,
        registerMobileDto.phone
      );

      const result = await this.commandBus.execute(command);

      // Check if registration was successful
      if (!result.success) {
        // If there are validation errors, throw ValidationException with details
        if (result.validationErrors && !result.validationErrors.isValid) {
          const errorMessages = result.validationErrors.errors.map(error => error.message).join(', ');
          throw new ValidationException(
            'Error en los datos de registro: ' + errorMessages,
            result.validationErrors.errors
          );
        }
        
        // If there's an auth response with a specific message, use that
        if (result.authResponse && result.authResponse.message) {
          throw new ConflictException(result.authResponse.message);
        }
        
        // Generic error fallback
        throw new BusinessException('Error durante el registro del usuario');
      }

      const response = {
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          userId: result.userId,
        },
        statusCode: 201,
      };

      // Emitir evento de registro exitoso
      this.eventBus.publish(
        new UserRegisteredEvent(
          result.userId,
          registerMobileDto.email || registerMobileDto.phone || '',
          {
            email: registerMobileDto.email || '',
            firstName: '',
            lastName: '',
            phone: registerMobileDto.phone,
            status: 'ACCEPTED',
          }
        )
      );

      return response;
    } catch (error) {
      // Emitir evento de fallo en registro
      this.eventBus.publish(
        new UserRegistrationFailedEvent(
          registerMobileDto.email || registerMobileDto.phone || '',
          registerMobileDto,
          error.message
        )
      );

      if (error instanceof BusinessException || error instanceof ValidationException || error instanceof ConflictException) {
        throw error;
      }
      throw new ServerException('Error interno durante el registro. Intente nuevamente.');
    }
  }

  async login(loginDto: LoginDto): Promise<any> {
    try {
      const command = new LoginUserCommand(loginDto.email, loginDto.password);
      return await this.commandBus.execute(command);
    } catch (error) {
      if (error instanceof AuthenticationException) {
        throw error;
      }
      throw new AuthenticationException('Error durante la autenticación. Intente nuevamente.');
    }
  }

  async loginMobile(loginMobileDto: LoginMobileDto): Promise<any> {
    try {
      const command = new LoginMobileUserCommand(loginMobileDto.password, loginMobileDto.phone, loginMobileDto.email);
      return await this.commandBus.execute(command);
    } catch (error) {
      if (error instanceof AuthenticationException) {
        throw error;
      }
      throw new AuthenticationException('Error durante la autenticación. Intente nuevamente.');
    }
  }

  async phoneLogin(phoneLoginDto: PhoneLoginDto): Promise<any> {
    try {
      // Solo permitir login con phone number, no email
      if (!phoneLoginDto.phone) {
        throw new AuthenticationException('Número de teléfono es requerido para el login por teléfono.');
      }
      
      const command = new PhoneLoginUserCommand(phoneLoginDto.password, phoneLoginDto.phone);
      return await this.commandBus.execute(command);
    } catch (error) {
      if (error instanceof AuthenticationException) {
        throw error;
      }
      throw new AuthenticationException('Error durante la autenticación. Intente nuevamente.');
    }
  }

  async validateUser(userId: string): Promise<any> {
    try {
      const command = new ValidateUserCommand(userId);
      return await this.commandBus.execute(command);
    } catch (error) {
      if (error instanceof CustomNotFoundException) {
        throw error;
      }
      throw new ServerException('Error durante la validación del usuario');
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const command = new RefreshTokenCommand(refreshToken);
      return await this.commandBus.execute(command);
    } catch (error) {
      if (error instanceof AuthenticationException || error instanceof CustomNotFoundException) {
        throw error;
      }
      throw new AuthenticationException('Token de actualización inválido o expirado');
    }
  }

  async verifyEmail(token: string): Promise<any> {
    try {
      console.log('Verifying email with token:', token);
      const command = new ConfirmEmailVerificationCommand(token);
      return await this.commandBus.execute(command);
    } catch (error) {
      if (error instanceof ValidationException || error instanceof CustomNotFoundException) {
        throw error;
      }
      throw new ServerException('Error durante la verificación del email. Intente nuevamente.');
    }
  }

  async logout(userId: string, email: string, logoutData: any): Promise<any> {
    try {
      // Si se proporciona un token, intentamos invalidarlo específicamente
      if (logoutData?.token) {
        try {
          // Verificar si el token es válido antes de invalidarlo
          const decoded = this.jwtService.verify(logoutData.token);
          if (decoded) {
            // Agregar el token a la lista negra
            this.tokenBlacklistService.addToBlacklist(logoutData.token);
          }
        } catch (tokenError) {
          // Si el token es inválido o está expirado, aún así proceder con el logout
          console.warn('Token inválido durante logout:', tokenError.message);
        }
      }

      // Ejecutar el comando de logout
      const command = new LogoutUserCommand(userId, email, logoutData);
      const result = await this.commandBus.execute(command);

      // Limpiar tokens expirados de la blacklist
      this.tokenBlacklistService.cleanExpiredTokens();

      return result;
    } catch (error) {
      // No lanzamos una excepción para que siempre devuelva éxito
      // Esto es similar al comportamiento del ejemplo que proporcionaste
      return {
        success: true,
        message: 'Sesión cerrada exitosamente',
        data: {
          userId,
          email,
        },
        statusCode: 200,
      };
    }
  }

  /**
   * Verifica si un token está en la lista negra
   */
  isTokenBlacklisted(token: string): boolean {
    return this.tokenBlacklistService.isBlacklisted(token);
  }

  private async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}