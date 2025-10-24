import { Injectable } from '@nestjs/common';
import { User } from '../../../shared/domain/entities/user.entity';
import { Password } from '../../../shared/domain/value-objects/password.vo';

/**
 * UserAuthenticationDomainService - Domain Service for Authentication
 * 
 * Encapsulates domain logic for user authentication:
 * - Password verification
 * - Account status validation
 * - Login attempt tracking
 * - Security policies
 */
@Injectable()
export class UserAuthenticationDomainService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 30;

  /**
   * Validate that a user can log in
   * 
   * Business Rules:
   * - User must exist
   * - User must be active
   * - Email must be verified (optional based on config)
   * - Account must not be locked
   * - Password must match
   */
  async validateLogin(
    user: User,
    providedPassword: string,
    requireEmailVerification: boolean = true,
  ): Promise<{ canLogin: boolean; reason?: string }> {
    // Check if user is active
    if (!user.isActive()) {
      return {
        canLogin: false,
        reason: 'Account is not active',
      };
    }

    // Check email verification if required
    if (requireEmailVerification && user.status !== 'ACCEPTED') {
      return {
        canLogin: false,
        reason: 'Email not verified',
      };
    }

    // Verify password
    const passwordMatches = await user.password.compare(providedPassword);
    if (!passwordMatches) {
      return {
        canLogin: false,
        reason: 'Invalid credentials',
      };
    }

    return {
      canLogin: true,
    };
  }

  /**
   * Determine if an account should be locked based on failed attempts
   */
  shouldLockAccount(failedAttempts: number): boolean {
    return failedAttempts >= this.MAX_FAILED_ATTEMPTS;
  }

  /**
   * Calculate when an account lockout expires
   */
  calculateLockoutExpiration(): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + this.LOCKOUT_DURATION_MINUTES);
    return now;
  }

  /**
   * Validate session creation
   */
  validateSessionCreation(user: User): { isValid: boolean; reason?: string } {
    if (!user.isActive()) {
      return {
        isValid: false,
        reason: 'User account is not active',
      };
    }

    if (user.status !== 'ACCEPTED') {
      return {
        isValid: false,
        reason: 'Email must be verified before creating a session',
      };
    }

    return {
      isValid: true,
    };
  }

  /**
   * Generate session metadata for tracking
   */
  generateSessionMetadata(
    ipAddress: string,
    userAgent: string,
  ): {
    sessionId: string;
    deviceInfo?: any;
    location?: any;
  } {
    // This is a simplified version - in production, you'd use proper libraries
    // to parse user agent and geolocate IP
    return {
      sessionId: this.generateSessionId(),
      deviceInfo: this.parseUserAgent(userAgent),
      location: undefined, // Would be populated by IP geolocation service
    };
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Parse user agent string (simplified)
   */
  private parseUserAgent(userAgent: string): any {
    // This is a placeholder - use a proper user agent parser library in production
    return {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown',
      raw: userAgent,
    };
  }

  /**
   * Validate password change request
   */
  validatePasswordChange(
    currentPassword: string,
    newPassword: string,
    user: User,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Verify current password
    if (!user.password.compare(currentPassword)) {
      errors.push('Current password is incorrect');
    }

    // Ensure new password is different
    if (currentPassword === newPassword) {
      errors.push('New password must be different from current password');
    }

    // Validate new password complexity
    if (!this.validatePasswordComplexity(newPassword)) {
      errors.push('New password does not meet complexity requirements');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate password complexity
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
}

