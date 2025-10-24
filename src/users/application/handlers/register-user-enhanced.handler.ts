import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RegisterUserCommand } from '../commands/register-user.command';
import { UserRepository } from 'src/shared/domain/repositories/user.repository';
import { Email } from 'src/shared/domain/value-objects/email.vo';
import { Password } from 'src/shared/domain/value-objects/password.vo';
import { PersonName } from 'src/shared/domain/value-objects/person-name.vo';
import { Phone } from 'src/shared/domain/value-objects/phone.vo';
import { CountryCode } from 'src/shared/domain/value-objects/country-code.vo';
import { UserRegistrationDomainService } from '../../domain/services/user-registration.domain-service';
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

/**
 * RegisterUserEnhancedHandler - Enhanced Command Handler with DDD + Event Sourcing
 * 
 * This handler demonstrates the complete DDD + CQRS + Event Sourcing pattern:
 * 
 * 1. Command Validation
 * 2. Domain Service Usage (for complex business logic)
 * 3. Aggregate Creation (User)
 * 4. Event Generation (UserRegisteredEvent)
 * 5. Repository Save (persists state + events)
 * 6. Event Publishing (for projections and side effects)
 * 
 * Flow:
 * Command -> Handler -> Domain Service -> Aggregate -> Events -> Repository -> Event Bus -> Projections
 */
@CommandHandler(RegisterUserCommand)
export class RegisterUserEnhancedHandler implements ICommandHandler<RegisterUserCommand, RegisterUserResult> {
  private readonly logger = new Logger(RegisterUserEnhancedHandler.name);

  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly registrationService: UserRegistrationDomainService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    this.logger.log(`Processing registration for email: ${command.email}`);

    try {
      // Step 1: Create Value Objects from command data
      const email = Email.fromString(command.email);
      
      // Step 2: Hash password before creating Password value object
      const hashedPassword = await bcrypt.hash(command.password, 12);
      const password = Password.fromHash(hashedPassword);

      // Step 3: Use Domain Service to validate and create user
      // Domain Service encapsulates business rules that don't belong to entities
      const registrationResult = await this.registrationService.registerUser(
        email,
        password,
        PersonName.create(command.firstName),
        PersonName.create(command.lastName),
                {
                  phone: command.phone ? Phone.create(command.phone) : undefined,
                },
      );

      // Step 4: Handle validation failures
      if (!registrationResult.success) {
        return {
          success: false,
          validationErrors: {
            isValid: false,
            errors: registrationResult.errors?.map(error => ({
              field: 'email',
              message: error,
              code: 'VALIDATION_ERROR',
            })) ?? [],
          },
        };
      }

      const user = registrationResult.user!;

      // Step 5: Apply domain event to the aggregate
      // The event is added to the aggregate's uncommitted events
      const userRegisteredEvent = new UserRegisteredEvent(
        user.id.value,
        user.email.value,
        {
          email: user.email.value,
          firstName: user.firstName.value,
          lastName: user.lastName.value,
          phone: user.phone?.value,
          status: user.status,
        },
      );

      // Add event to aggregate's uncommitted events
      user.apply(userRegisteredEvent);

      // Step 6: Save aggregate
      // Repository will:
      // - Persist the aggregate state (users table)
      // - Persist all uncommitted events (domain_events table)
      // - Publish events to event bus
      await this.userRepository.save(user);

      this.logger.log(`User registered successfully: ${user.id.value}`);

      // Step 7: Return success result
      return {
        success: true,
        userId: user.id.value,
        authResponse: {
          message: 'User registered successfully. Please check your email for verification.',
          code: 'REGISTRATION_SUCCESS',
        },
      };

    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);

      // In production, you might want to emit a UserRegistrationFailedEvent here
      // for monitoring and analytics

      return {
        success: false,
        validationErrors: {
          isValid: false,
          errors: [
            {
              field: 'general',
              message: 'Registration failed. Please try again.',
              code: 'REGISTRATION_ERROR',
            },
          ],
        },
      };
    }
  }
}

/**
 * Key DDD Concepts Demonstrated:
 * 
 * 1. **Ubiquitous Language**: 
 *    - RegisterUserCommand, UserRegisteredEvent, UserRepository
 *    - Domain-specific terminology throughout
 * 
 * 2. **Value Objects**: 
 *    - Email, Password encapsulate validation and behavior
 *    - Immutable and self-validating
 * 
 * 3. **Aggregates**: 
 *    - User is an aggregate root
 *    - Maintains consistency boundaries
 *    - Generates domain events
 * 
 * 4. **Domain Services**: 
 *    - UserRegistrationDomainService handles complex business logic
 *    - Coordinates multiple operations
 * 
 * 5. **Domain Events**: 
 *    - UserRegisteredEvent represents a business fact
 *    - Enables event-driven architecture
 *    - Supports eventual consistency
 * 
 * 6. **Repository Pattern**: 
 *    - Abstracts persistence details
 *    - Provides aggregate retrieval/storage
 *    - Integrates with Event Store
 * 
 * 7. **CQRS**: 
 *    - Commands for writes (this handler)
 *    - Queries for reads (separate query handlers)
 *    - Optimized read/write models
 * 
 * 8. **Event Sourcing**: 
 *    - Events persisted to event store
 *    - State can be rebuilt from events
 *    - Complete audit trail
 */

