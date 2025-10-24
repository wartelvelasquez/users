import { DomainEventBase, DomainEventMetadata } from '../../../shared/domain/events/domain-event.base';

export interface UserRegisteredPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
}

/**
 * UserRegisteredEvent - Emitted when a new user successfully registers
 * 
 * This event triggers:
 * - Email verification workflow
 * - User projection creation
 * - Welcome notifications
 * - Analytics tracking
 */
export class UserRegisteredEvent extends DomainEventBase {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly userData: UserRegisteredPayload,
    metadata?: Partial<DomainEventMetadata>,
  ) {
    super(userId, metadata);
  }

  public getPayload(): Record<string, any> {
    return {
      userId: this.userId,
      email: this.email,
      userData: this.userData,
    };
  }
}


