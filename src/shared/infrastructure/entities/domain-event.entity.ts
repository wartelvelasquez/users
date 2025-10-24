import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * DomainEventEntity - Infrastructure Entity for Event Sourcing
 * 
 * This entity persists domain events to enable:
 * - Event Sourcing: Reconstruct aggregate state from events
 * - Event Store: Complete audit trail of all domain changes
 * - Event Replay: Rebuild projections or analytics
 * - Temporal Queries: Query state at any point in time
 */
@Entity('domain_events')
@Index(['aggregateId', 'version'], { unique: true })
@Index(['aggregateId'])
@Index(['aggregateType'])
@Index(['eventType'])
@Index(['occurredAt'])
@Index(['createdAt'])
export class DomainEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'aggregate_id', type: 'uuid' })
  aggregateId: string;

  @Column({ name: 'aggregate_type', type: 'varchar' })
  aggregateType: string;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType: string;

  @Column({ name: 'event_data', type: 'jsonb' })
  eventData: any;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp?: string;
    [key: string]: any;
  };

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'occurred_at', type: 'timestamp' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Factory method to create a DomainEventEntity from a domain event
   */
  static fromDomainEvent(
    aggregateId: string,
    aggregateType: string,
    event: any,
    version: number,
    metadata?: any,
  ): DomainEventEntity {
    const entity = new DomainEventEntity();
    entity.aggregateId = aggregateId;
    entity.aggregateType = aggregateType;
    entity.eventType = event.constructor.name;
    entity.eventData = this.serializeEvent(event);
    entity.metadata = metadata;
    entity.version = version;
    entity.occurredAt = new Date();
    return entity;
  }

  /**
   * Serialize event to JSON-compatible format
   */
  private static serializeEvent(event: any): any {
    // Remove circular references and non-serializable data
    const serialized: any = {};
    
    for (const key in event) {
      if (event.hasOwnProperty(key)) {
        const value = event[key];
        
        // Skip functions and symbols
        if (typeof value === 'function' || typeof value === 'symbol') {
          continue;
        }
        
        // Handle dates
        if (value instanceof Date) {
          serialized[key] = value.toISOString();
          continue;
        }
        
        // Handle objects with toJSON
        if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
          serialized[key] = value.toJSON();
          continue;
        }
        
        serialized[key] = value;
      }
    }
    
    return serialized;
  }

  /**
   * Convert to plain object for streaming/messaging
   */
  toPlainObject(): any {
    return {
      id: this.id,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      eventType: this.eventType,
      eventData: this.eventData,
      metadata: this.metadata,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
    };
  }
}

