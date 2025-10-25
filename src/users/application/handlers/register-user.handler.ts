import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { RegisterUserCommand } from '../commands/register-user.command';
import { UserRepository } from 'src/shared/domain/repositories/user.repository';
import { User } from 'src/shared/domain/entities/user.entity';
import { Email } from 'src/shared/domain/value-objects/email.vo';
import { UserId } from 'src/shared/domain/value-objects/user-id.vo';
import { Password } from 'src/shared/domain/value-objects/password.vo';
import { PersonName } from 'src/shared/domain/value-objects/person-name.vo';
import { Phone } from 'src/shared/domain/value-objects/phone.vo';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import * as bcrypt from 'bcrypt';

export interface RegisterUserResult {
  success: boolean;
  userId?: string;
  validationErrors?: {
    isValid: boolean;
    errors: Array<{
      field: string;
      message: string;
      code: string;
    }>;
  };
  authResponse?: {
    message: string;
    code: string;
  };
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand, RegisterUserResult> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    try {
      // Validar que el email no exista
      const email = Email.fromString(command.email);
      const emailExists = await this.userRepository.emailExists(email);
      
      if (emailExists) {
        return {
          success: false,
          validationErrors: {
            isValid: false,
            errors: [
              {
                field: 'email',
                message: 'Email already exists',
                code: 'EMAIL_ALREADY_EXISTS'
              }
            ]
          }
        };
      }

      // Validar que el número de teléfono no exista si se proporciona
      if (command.phone) {
        const phoneExists = await this.userRepository.findByPhoneNumber(command.phone);
        if (phoneExists) {
          return {
            success: false,
            validationErrors: {
              isValid: false,
              errors: [
                {
                  field: 'phone',
                  message: 'Phone number already exists',
                  code: 'PHONE_ALREADY_EXISTS'
                }
              ]
            }
          };
        }
      }
      // Hashear la contraseña
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(command.password, saltRounds);

      // Crear la instancia del usuario
      const user = User.create({
        email,
        password: Password.fromHash(hashedPassword),
        firstName: PersonName.create(command.firstName),
        lastName: PersonName.create(command.lastName),
        phone: command.phone ? Phone.create(command.phone) : undefined,
      });

      // Guardar el usuario en la base de datos
      await this.userRepository.save(user);

      // Emitir evento de usuario registrado para crear proyección (comentado temporalmente)
      // this.eventBus.publish(new UserRegisteredEvent(
      //   user.id.value,
      //   user.email.value,
      //   {
      //     email: user.email.value,
      //     firstName: user.firstName.value,
      //     lastName: user.lastName.value,
      //     phone: user.phone?.value,
      //     status: user.status,
      //   },
      //   new Date()
      // ));

      return {
        success: true,
        userId: user.id.value,
      };

    } catch (error) {
      // Manejar errores de validación
      if (error instanceof Error) {
        if (error.message.includes('Invalid email format')) {
          return {
            success: false,
            validationErrors: {
              isValid: false,
              errors: [
                {
                  field: 'email',
                  message: 'Invalid email format',
                  code: 'INVALID_EMAIL_FORMAT'
                }
              ]
            }
          };
        }

        if (error.message.includes('First name is required')) {
          return {
            success: false,
            validationErrors: {
              isValid: false,
              errors: [
                {
                  field: 'firstName',
                  message: 'First name is required',
                  code: 'FIRST_NAME_REQUIRED'
                }
              ]
            }
          };
        }

        if (error.message.includes('Last name is required')) {
          return {
            success: false,
            validationErrors: {
              isValid: false,
              errors: [
                {
                  field: 'lastName',
                  message: 'Last name is required',
                  code: 'LAST_NAME_REQUIRED'
                }
              ]
            }
          };
        }

        if (error.message.includes('Password is required')) {
          return {
            success: false,
            validationErrors: {
              isValid: false,
              errors: [
                {
                  field: 'password',
                  message: 'Password is required',
                  code: 'PASSWORD_REQUIRED'
                }
              ]
            }
          };
        }
      }

      // Error genérico
      return {
        success: false,
        authResponse: {
          message: 'Registration failed due to an unexpected error',
          code: 'REGISTRATION_FAILED'
        }
      };
    }
  }
}
