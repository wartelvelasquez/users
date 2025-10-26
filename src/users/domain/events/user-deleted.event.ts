import { DomainEventBase } from '../../../shared/domain/events/domain-event.base';

export class UserDeletedEvent extends DomainEventBase {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly deletedAt: Date,
    public readonly hardDelete: boolean = false,
    metadata?: any,
  ) {
    super(userId, metadata);
  }

  getPayload(): Record<string, any> {
    return {
      userId: this.userId,
      email: this.email,
      deletedAt: this.deletedAt.toISOString(),
      hardDelete: this.hardDelete,
    };
  }
}