import { IEvent } from '@nestjs/cqrs';
import { DomainEventEntity } from '../entities/domain-event.entity';

export interface EventMetadata {
  userId?: string;
  correlationId?: string;
  causationId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface EventStoreQuery {
  aggregateId?: string;
  aggregateType?: string;
  eventType?: string;
  fromVersion?: number;
  toVersion?: number;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface IEventStore {
  /**
   * Append a new event to the event store
   */
  appendEvent(
    aggregateId: string,
    aggregateType: string,
    event: IEvent,
    version: number,
    metadata?: EventMetadata,
  ): Promise<DomainEventEntity>;

  /**
   * Append multiple events atomically
   */
  appendEvents(
    aggregateId: string,
    aggregateType: string,
    events: IEvent[],
    startVersion: number,
    metadata?: EventMetadata,
  ): Promise<DomainEventEntity[]>;

  /**
   * Get all events for a specific aggregate
   */
  getEventsForAggregate(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number,
  ): Promise<DomainEventEntity[]>;

  /**
   * Get events by query criteria
   */
  getEvents(query: EventStoreQuery): Promise<DomainEventEntity[]>;

  /**
   * Get the latest version number for an aggregate
   */
  getLatestVersion(aggregateId: string): Promise<number>;

  /**
   * Stream events (for event replay or projections)
   */
  streamEvents(
    callback: (event: DomainEventEntity) => Promise<void>,
    query?: EventStoreQuery,
  ): Promise<void>;

  /**
   * Check if an aggregate exists
   */
  aggregateExists(aggregateId: string): Promise<boolean>;

  /**
   * Get event count for an aggregate
   */
  getEventCount(aggregateId: string): Promise<number>;
}

