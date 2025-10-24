import { IEvent } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Metadata for domain events
 * Contains contextual information about when and how the event was created
 */
export interface DomainEventMetadata {
  /**
   * Unique identifier for the event
   */
  eventId: string;

  /**
   * ID of the user who triggered this event
   */
  userId?: string;

  /**
   * Correlation ID to trace related events across aggregates
   */
  correlationId?: string;

  /**
   * Causation ID - ID of the event/command that caused this event
   */
  causationId?: string;

  /**
   * IP address of the client that triggered the event
   */
  ipAddress?: string;

  /**
   * User agent of the client
   */
  userAgent?: string;

  /**
   * When the event occurred (business time)
   */
  occurredAt: Date;

  /**
   * Additional context-specific metadata
   */
  [key: string]: any;
}

/**
 * Base class for all Domain Events
 * 
 * Domain events represent facts that have happened in the domain.
 * They are immutable and always in the past tense.
 * 
 * Benefits:
 * - Explicit representation of business events
 * - Enable event sourcing and audit trails
 * - Facilitate event-driven architectures
 * - Provide rich metadata for debugging and analytics
 */
export abstract class DomainEventBase implements IEvent {
  /**
   * Unique identifier for this event instance
   */
  public readonly eventId: string;

  /**
   * ID of the aggregate that generated this event
   */
  public readonly aggregateId: string;

  /**
   * When this event occurred
   */
  public readonly occurredAt: Date;

  /**
   * Event metadata
   */
  public readonly metadata: DomainEventMetadata;

  constructor(
    aggregateId: string,
    metadata?: Partial<DomainEventMetadata>,
  ) {
    this.aggregateId = aggregateId;
    this.eventId = metadata?.eventId ?? uuidv4();
    this.occurredAt = metadata?.occurredAt ?? new Date();
    
    this.metadata = {
      eventId: this.eventId,
      occurredAt: this.occurredAt,
      correlationId: metadata?.correlationId,
      causationId: metadata?.causationId,
      userId: metadata?.userId,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      ...metadata,
    };
  }

  /**
   * Get the event type name (class name)
   */
  getEventType(): string {
    return this.constructor.name;
  }

  /**
   * Convert event to JSON-serializable format
   */
  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventType: this.getEventType(),
      aggregateId: this.aggregateId,
      occurredAt: this.occurredAt.toISOString(),
      metadata: this.metadata,
      ...this.getPayload(),
    };
  }

  /**
   * Get the event payload (must be implemented by subclasses)
   */
  public abstract getPayload(): Record<string, any>;

  /**
   * Create metadata object for event creation
   */
  static createMetadata(
    userId?: string,
    correlationId?: string,
    causationId?: string,
    additionalMetadata?: Record<string, any>,
  ): Partial<DomainEventMetadata> {
    return {
      eventId: uuidv4(),
      userId,
      correlationId,
      causationId,
      occurredAt: new Date(),
      ...additionalMetadata,
    };
  }
}

/**
 * Helper type to extract payload from domain event
 */
export type EventPayload<T extends DomainEventBase> = ReturnType<T['getPayload']>;

