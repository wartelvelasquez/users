import { Injectable } from '@nestjs/common';
import { User } from '../../../shared/domain/entities/user.entity';
import { Email } from '../../../shared/domain/value-objects/email.vo';
import { Password } from '../../../shared/domain/value-objects/password.vo';
import { PersonName } from '../../../shared/domain/value-objects/person-name.vo';
import { Phone } from '../../../shared/domain/value-objects/phone.vo';
import { UserRepository } from '../../../shared/domain/repositories/user.repository';

/**
 * UserRegistrationDomainService - Domain Service for User Registration
 * 
 * Domain Services encapsulate domain logic that:
 * - Doesn't naturally belong to an entity or value object
 * - Involves multiple aggregates
 * - Represents a significant domain operation
 * 
 * This service handles the business rules for user registration:
 * - Email uniqueness validation
 * - Password complexity validation
 * - Business rule enforcement
 */
@Injectable()
export class UserRegistrationDomainService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Validate that a user can be registered
   * 
   * Business Rules:
   * - Email must be unique
   * - Email must be valid format
   * - Password must meet complexity requirements
   */
  async validateRegistration(
    email: Email,
    password: Password,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check email uniqueness
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      errors.push('Email is already registered');
    }

    // Validate password complexity
    if (!this.validatePasswordComplexity(password.value)) {
      errors.push('Password does not meet complexity requirements');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a new user with business rule validation
   */
  async registerUser(
    email: Email,
    password: Password,
    firstName: PersonName,
    lastName: PersonName,
    additionalData?: {
      phone?: Phone;
    },
  ): Promise<{ success: boolean; user?: User; errors?: string[] }> {
    // Validate registration
    const validation = await this.validateRegistration(email, password);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    // Create user aggregate
    const user = User.create({
      email,
      password,
      firstName,
      lastName,
      phone: additionalData?.phone,
    });

    return {
      success: true,
      user,
    };
  }

  /**
   * Validate password complexity
   * 
   * Business Rule: Password must:
   * - Be at least 8 characters
   * - Contain at least one uppercase letter
   * - Contain at least one lowercase letter
   * - Contain at least one number
   * - Contain at least one special character
   */
  private validatePasswordComplexity(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  }

  /**
   * Check if an email is available for registration
   */
  async isEmailAvailable(email: Email): Promise<boolean> {
    const existingUser = await this.userRepository.findByEmail(email);
    return existingUser === null;
  }
}

