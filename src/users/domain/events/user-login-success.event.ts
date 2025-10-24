import { DomainEventBase, DomainEventMetadata } from '../../../shared/domain/events/domain-event.base';

export interface LoginData {
  email?: string;
  password?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
}

/**
 * UserLoginSuccessEvent - Emitted when a user successfully logs in
 * 
 * This event triggers:
 * - User projection update (login count, last login)
 * - Session tracking
 * - Security monitoring
 * - Analytics
 */
export class UserLoginSuccessEvent extends DomainEventBase {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly loginData: LoginData,
    metadata?: Partial<DomainEventMetadata>,
  ) {
    super(userId, metadata);
  }

  public getPayload(): Record<string, any> {
    return {
      userId: this.userId,
      email: this.email,
      loginData: this.loginData,
    };
  }
}


