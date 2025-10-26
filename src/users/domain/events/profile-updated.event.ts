import { DomainEventBase } from '../../../shared/domain/events/domain-event.base';

/**
 * ProfileUpdatedEvent - Evento de dominio para actualización de perfil
 */
export class ProfileUpdatedEvent extends DomainEventBase {
  constructor(
    public readonly userId: string,
    public readonly changes: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
    metadata?: any,
  ) {
    super(userId, metadata);
  }

  getPayload(): Record<string, any> {
    return {
      userId: this.userId,
      changes: this.changes,
    };
  }
}