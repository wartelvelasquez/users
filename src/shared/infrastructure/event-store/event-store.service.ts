import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { IEvent } from '@nestjs/cqrs';
import { DomainEventEntity } from '../entities/domain-event.entity';
import { IEventStore, EventMetadata, EventStoreQuery } from './event-store.interface';

/**
 * EventStore Service - Core Event Sourcing Infrastructure
 * 
 * Responsibilities:
 * - Persist domain events to database
 * - Retrieve event history for aggregate reconstruction
 * - Stream events for projections and event replay
 * - Ensure event ordering and consistency
 * - Handle optimistic concurrency control
 */
@Injectable()
export class EventStoreService implements IEventStore {
  private readonly logger = new Logger(EventStoreService.name);

  constructor(
    @InjectRepository(DomainEventEntity, 'write')
    private readonly eventRepository: Repository<DomainEventEntity>,
  ) {}

  /**
   * Append a single event to the event store
   */
  async appendEvent(
    aggregateId: string,
    aggregateType: string,
    event: IEvent,
    version: number,
    metadata?: EventMetadata,
  ): Promise<DomainEventEntity> {
    try {
      const eventEntity = DomainEventEntity.fromDomainEvent(
        aggregateId,
        aggregateType,
        event,
        version,
        {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      );

      const savedEvent = await this.eventRepository.save(eventEntity);
      
      this.logger.log(
        `Event appended: ${event.constructor.name} for ${aggregateType}(${aggregateId}) v${version}`,
      );

      return savedEvent;
    } catch (error) {
      // Handle unique constraint violation (optimistic locking)
      if (error.code === '23505') {
        this.logger.error(
          `Concurrency conflict detected for ${aggregateType}(${aggregateId}) v${version}`,
        );
        throw new Error(
          `Concurrency conflict: Version ${version} already exists for aggregate ${aggregateId}`,
        );
      }
      
      this.logger.error(`Failed to append event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Append multiple events atomically (within a transaction)
   */
  async appendEvents(
    aggregateId: string,
    aggregateType: string,
    events: IEvent[],
    startVersion: number,
    metadata?: EventMetadata,
  ): Promise<DomainEventEntity[]> {
    if (events.length === 0) {
      return [];
    }

    try {
      const eventEntities = events.map((event, index) =>
        DomainEventEntity.fromDomainEvent(
          aggregateId,
          aggregateType,
          event,
          startVersion + index,
          {
            ...metadata,
            timestamp: new Date().toISOString(),
          },
        ),
      );

      const savedEvents = await this.eventRepository.save(eventEntities);
      
      this.logger.log(
        `${events.length} events appended for ${aggregateType}(${aggregateId}) starting from v${startVersion}`,
      );

      return savedEvents;
    } catch (error) {
      if (error.code === '23505') {
        this.logger.error(
          `Concurrency conflict detected for ${aggregateType}(${aggregateId})`,
        );
        throw new Error(
          `Concurrency conflict: One or more versions already exist for aggregate ${aggregateId}`,
        );
      }
      
      this.logger.error(`Failed to append events: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all events for a specific aggregate (ordered by version)
   */
  async getEventsForAggregate(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number,
  ): Promise<DomainEventEntity[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.aggregate_id = :aggregateId', { aggregateId })
      .orderBy('event.version', 'ASC');

    if (fromVersion !== undefined) {
      queryBuilder.andWhere('event.version >= :fromVersion', { fromVersion });
    }

    if (toVersion !== undefined) {
      queryBuilder.andWhere('event.version <= :toVersion', { toVersion });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get events by query criteria
   */
  async getEvents(query: EventStoreQuery): Promise<DomainEventEntity[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .orderBy('event.created_at', 'ASC');

    if (query.aggregateId) {
      queryBuilder.andWhere('event.aggregate_id = :aggregateId', { 
        aggregateId: query.aggregateId 
      });
    }

    if (query.aggregateType) {
      queryBuilder.andWhere('event.aggregate_type = :aggregateType', { 
        aggregateType: query.aggregateType 
      });
    }

    if (query.eventType) {
      queryBuilder.andWhere('event.event_type = :eventType', { 
        eventType: query.eventType 
      });
    }

    if (query.fromVersion !== undefined) {
      queryBuilder.andWhere('event.version >= :fromVersion', { 
        fromVersion: query.fromVersion 
      });
    }

    if (query.toVersion !== undefined) {
      queryBuilder.andWhere('event.version <= :toVersion', { 
        toVersion: query.toVersion 
      });
    }

    if (query.fromDate) {
      queryBuilder.andWhere('event.occurred_at >= :fromDate', { 
        fromDate: query.fromDate 
      });
    }

    if (query.toDate) {
      queryBuilder.andWhere('event.occurred_at <= :toDate', { 
        toDate: query.toDate 
      });
    }

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get the latest version number for an aggregate
   */
  async getLatestVersion(aggregateId: string): Promise<number> {
    const result = await this.eventRepository
      .createQueryBuilder('event')
      .select('MAX(event.version)', 'maxVersion')
      .where('event.aggregate_id = :aggregateId', { aggregateId })
      .getRawOne();

    return result?.maxVersion ?? 0;
  }

  /**
   * Stream events for processing (useful for projections and event replay)
   */
  async streamEvents(
    callback: (event: DomainEventEntity) => Promise<void>,
    query?: EventStoreQuery,
  ): Promise<void> {
    const batchSize = 100;
    let offset = query?.offset ?? 0;
    let hasMore = true;

    while (hasMore) {
      const events = await this.getEvents({
        ...query,
        limit: batchSize,
        offset,
      });

      if (events.length === 0) {
        hasMore = false;
        break;
      }

      for (const event of events) {
        try {
          await callback(event);
        } catch (error) {
          this.logger.error(
            `Error processing event ${event.id}: ${error.message}`,
            error.stack,
          );
          throw error;
        }
      }

      offset += batchSize;
      hasMore = events.length === batchSize;
    }

    this.logger.log(`Streamed ${offset} events`);
  }

  /**
   * Check if an aggregate exists in the event store
   */
  async aggregateExists(aggregateId: string): Promise<boolean> {
    const count = await this.eventRepository.count({
      where: { aggregateId },
    });
    return count > 0;
  }

  /**
   * Get total event count for an aggregate
   */
  async getEventCount(aggregateId: string): Promise<number> {
    return await this.eventRepository.count({
      where: { aggregateId },
    });
  }

  /**
   * Replay events to rebuild an aggregate
   */
  async replayAggregate(
    aggregateId: string,
    applyEventCallback: (event: DomainEventEntity) => void,
  ): Promise<void> {
    const events = await this.getEventsForAggregate(aggregateId);
    
    this.logger.log(`Replaying ${events.length} events for aggregate ${aggregateId}`);
    
    for (const event of events) {
      applyEventCallback(event);
    }
  }

  /**
   * Get events grouped by aggregate
   */
  async getEventsByAggregateType(
    aggregateType: string,
    limit: number = 100,
  ): Promise<Map<string, DomainEventEntity[]>> {
    const events = await this.getEvents({ aggregateType, limit });
    
    const groupedEvents = new Map<string, DomainEventEntity[]>();
    
    for (const event of events) {
      if (!groupedEvents.has(event.aggregateId)) {
        groupedEvents.set(event.aggregateId, []);
      }
      groupedEvents.get(event.aggregateId)!.push(event);
    }
    
    return groupedEvents;
  }
}

