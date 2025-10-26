import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Interval } from '@nestjs/schedule';
import { DomainEventEntity } from '../entities/domain-event.entity';
import { UserProjectionEntity } from '../entities/user-projection.entity';

/**
 * ProjectionSyncService - Sincronización de Proyecciones entre Write y Read DB
 * 
 * Este servicio es el CORAZÓN del patrón CQRS con bases de datos separadas.
 * 
 * Responsabilidades:
 * 1. Leer eventos desde la DB de escritura (domain_events)
 * 2. Aplicar eventos a las proyecciones en la DB de lectura (user)
 * 3. Mantener eventual consistency entre ambas bases
 * 4. Tracking de progreso y recovery en caso de fallos
 * 
 * Estrategias de Sincronización:
 * - Event-driven: Reacciona a eventos publicados (real-time)
 * - Polling: Revisa periódicamente nuevos eventos (backup)
 * - Catch-up: Procesa eventos atrasados al inicio
 */
@Injectable()
export class ProjectionSyncService implements OnModuleInit {
  private readonly logger = new Logger(ProjectionSyncService.name);
  private isSyncing = false;
  private lastProcessedVersion = 0;

  constructor(
    @InjectDataSource('write')
    private readonly writeDataSource: DataSource,
    @InjectDataSource('read')
    private readonly readDataSource: DataSource,
    private readonly eventBus: EventBus,
  ) {}

  async onModuleInit() {
    this.logger.log('🔄 Initializing Projection Sync Service');
    
    // Cargar último estado procesado
    await this.loadProjectionStatus();
    
    // Ejecutar catch-up inicial
    await this.catchUpProjections();
    
    this.logger.log('✅ Projection Sync Service initialized');
  }

  /**
   * Cargar el estado de sincronización desde la read DB
   */
  private async loadProjectionStatus(): Promise<void> {
    try {
      const result = await this.readDataSource.query(`
        SELECT last_processed_version 
        FROM projection_status 
        WHERE projection_name = 'user'
      `);

      if (result && result.length > 0) {
        this.lastProcessedVersion = result[0].last_processed_version || 0;
        this.logger.log(`📊 Last processed version: ${this.lastProcessedVersion}`);
      }
    } catch (error) {
      this.logger.warn('⚠️  Could not load projection status, starting from 0');
      this.lastProcessedVersion = 0;
    }
  }

  /**
   * Catch-up: Procesar eventos pendientes al inicio
   */
  private async catchUpProjections(): Promise<void> {
    this.logger.log('🔄 Starting catch-up projection sync...');

    try {
      // Obtener eventos no procesados de la write DB
      const unprocessedEvents = await this.writeDataSource
        .getRepository(DomainEventEntity)
        .createQueryBuilder('event')
        .where('event.version > :lastVersion', { 
          lastVersion: this.lastProcessedVersion 
        })
        .orderBy('event.version', 'ASC')
        .limit(1000) // Procesar en batches
        .getMany();

      if (unprocessedEvents.length === 0) {
        this.logger.log('✅ No events to catch up');
        return;
      }

      this.logger.log(`📦 Catching up ${unprocessedEvents.length} events`);

      // Procesar eventos en batch
      for (const event of unprocessedEvents) {
        await this.processEvent(event);
      }

      this.logger.log('✅ Catch-up completed successfully');
    } catch (error) {
      this.logger.error(`❌ Catch-up failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Sincronización periódica (backup strategy)
   * Se ejecuta cada 30 segundos
   */
  @Interval(30000)
  async periodicSync(): Promise<void> {
    if (this.isSyncing) {
      return; // Evitar overlapping
    }

    this.isSyncing = true;

    try {
      await this.catchUpProjections();
    } catch (error) {
      this.logger.error(`❌ Periodic sync failed: ${error.message}`);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Procesar un evento individual y actualizar proyección
   */
  private async processEvent(event: DomainEventEntity): Promise<void> {
    try {
      const eventType = event.eventType;
      const eventData = event.eventData;

      this.logger.debug(`Processing event: ${eventType} (v${event.version})`);

      switch (eventType) {
        case 'UserRegisteredEvent':
          await this.handleUserRegistered(eventData, event);
          break;

        case 'UserLoginSuccessEvent':
          await this.handleUserLoginSuccess(eventData, event);
          break;

        case 'EmailVerificationSuccessEvent':
          await this.handleEmailVerified(eventData, event);
          break;

        case 'ProfileUpdatedEvent':
          await this.handleProfileUpdated(eventData, event);
          break;

        case 'UserStatusChangedEvent':
          await this.handleStatusChanged(eventData, event);
          break;

        case 'UserDeletedEvent':
          await this.handleUserDeleted(eventData, event);
          break;

        default:
          this.logger.debug(`No handler for event type: ${eventType}`);
      }

      // Actualizar último evento procesado
      await this.updateProjectionStatus(event.version);

      this.lastProcessedVersion = event.version;

    } catch (error) {
      this.logger.error(
        `❌ Failed to process event ${event.id}: ${error.message}`,
        error.stack,
      );
      await this.recordError(error.message);
      throw error;
    }
  }

  /**
   * Handler: UserRegisteredEvent
   */
  private async handleUserRegistered(
    eventData: any,
    event: DomainEventEntity,
  ): Promise<void> {
    const userData = eventData.userData;
    
    await this.readDataSource
      .createQueryBuilder()
      .insert()
      .into(UserProjectionEntity)
      .values({
        id: eventData.userId,
        email: eventData.email,
        fullName: `${userData.firstName} ${userData.lastName}`,
        status: userData.status || 'PENDING_VERIFICATION',
        phone: userData.phone,
        failedLoginAttempts: 0,
        profileCompletion: 20, // Base completion
        createdAt: event.occurredAt,
        updatedAt: event.occurredAt,
      })
      .orIgnore() // Si ya existe, ignorar
      .execute();

    this.logger.log(`✅ Created projection for user ${eventData.userId}`);
  }

  /**
   * Handler: UserLoginSuccessEvent
   */
  private async handleUserLoginSuccess(
    eventData: any,
    event: DomainEventEntity,
  ): Promise<void> {
    await this.readDataSource
      .createQueryBuilder()
      .update(UserProjectionEntity)
      .set({
        lastLoginAt: event.occurredAt,
        lastLoginIp: eventData.loginData?.ipAddress,
        loginCount: () => 'login_count + 1',
        failedLoginAttempts: 0,
        updatedAt: event.occurredAt,
        lastEventVersion: event.version,
      })
      .where('id = :userId', { userId: eventData.userId })
      .execute();

    this.logger.log(`✅ Updated login info for user ${eventData.userId}`);
  }

  /**
   * Handler: EmailVerificationSuccessEvent
   */
  private async handleEmailVerified(
    eventData: any,
    event: DomainEventEntity,
  ): Promise<void> {
    await this.readDataSource
      .createQueryBuilder()
      .update(UserProjectionEntity)
      .set({
        status: 'ACCEPTED',
        updatedAt: event.occurredAt,
      })
      .where('id = :userId', { userId: eventData.userId })
      .execute();

    this.logger.log(`✅ Updated email verification for user ${eventData.userId}`);
  }

  /**
   * Handler: ProfileUpdatedEvent
   */
  private async handleProfileUpdated(
    eventData: any,
    event: DomainEventEntity,
  ): Promise<void> {
    const changes = eventData.changes || {};
    const updateData: any = {
      updatedAt: event.occurredAt,
      lastEventVersion: event.version,
    };

    if (changes.firstName) {
      updateData.firstName = changes.firstName;
    }

    // Actualizar full_name si firstName o lastName cambian
    if (changes.firstName || changes.lastName) {
      const projection = await this.readDataSource
        .getRepository(UserProjectionEntity)
        .findOne({ where: { id: eventData.userId } });

      if (projection) {
        const currentName = projection.fullName.split(' ');
        const firstName = changes.firstName || currentName[0] || '';
        const lastName = changes.lastName || currentName.slice(1).join(' ') || '';
        updateData.fullName = `${firstName} ${lastName}`.trim();
      }
    }

    if (changes.phone !== undefined) {
      updateData.phone = changes.phone;
    }

    await this.readDataSource
      .createQueryBuilder()
      .update(UserProjectionEntity)
      .set(updateData)
      .where('id = :userId', { userId: eventData.userId })
      .execute();

    this.logger.log(`✅ Updated profile for user ${eventData.userId}`);
  }

  /**
   * Handler: UserStatusChangedEvent
   */
  private async handleStatusChanged(
    eventData: any,
    event: DomainEventEntity,
  ): Promise<void> {
    await this.readDataSource
      .createQueryBuilder()
      .update(UserProjectionEntity)
      .set({
        status: eventData.newStatus,
        updatedAt: event.occurredAt,
        lastEventVersion: event.version,
      })
      .where('id = :userId', { userId: eventData.userId })
      .execute();

    this.logger.log(`✅ Updated status for user ${eventData.userId}`);
  }

  /**
   * Handler: UserDeletedEvent
   */
  private async handleUserDeleted(
    eventData: any,
    event: DomainEventEntity,
  ): Promise<void> {
    await this.readDataSource
      .createQueryBuilder()
      .update(UserProjectionEntity)
      .set({
        deletedAt: event.occurredAt,
        status: 'BLOCKED',
        updatedAt: event.occurredAt,
      })
      .where('id = :userId', { userId: eventData.userId })
      .execute();

    this.logger.log(`✅ Soft deleted user ${eventData.userId} in projection`);
  }

  /**
   * Actualizar estado de sincronización
   */
  private async updateProjectionStatus(version: number): Promise<void> {
    await this.readDataSource.query(`
      UPDATE projection_status 
      SET 
        last_processed_version = $1,
        last_processed_at = CURRENT_TIMESTAMP,
        total_events_processed = total_events_processed + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE projection_name = 'user'
    `, [version]);
  }

  /**
   * Registrar error de sincronización
   */
  private async recordError(errorMessage: string): Promise<void> {
    await this.readDataSource.query(`
      UPDATE projection_status 
      SET 
        error_count = error_count + 1,
        last_error = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE projection_name = 'user'
    `, [errorMessage]);
  }

  /**
   * Rebuild completo desde eventos (útil para recovery)
   */
  async rebuildAllProjections(): Promise<void> {
    this.logger.warn('🔄 Starting FULL projection rebuild...');

    try {
      // Limpiar proyecciones existentes
      await this.readDataSource.query('TRUNCATE TABLE user CASCADE');

      // Reset status
      await this.readDataSource.query(`
        UPDATE projection_status 
        SET 
          last_processed_version = 0,
          total_events_processed = 0
        WHERE projection_name = 'user'
      `);

      this.lastProcessedVersion = 0;

      // Reprocesar todos los eventos
      await this.catchUpProjections();

      this.logger.log('✅ Full projection rebuild completed');
    } catch (error) {
      this.logger.error(`❌ Rebuild failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de sincronización
   */
  async getSyncStatus(): Promise<any> {
    const status = await this.readDataSource.query(`
      SELECT * FROM projection_status 
      WHERE projection_name = 'user'
    `);

    const writeEventsCount = await this.writeDataSource
      .getRepository(DomainEventEntity)
      .count();

    const readProjectionsCount = await this.readDataSource
      .getRepository(UserProjectionEntity)
      .count();

    return {
      projectionStatus: status[0],
      writeDB: {
        totalEvents: writeEventsCount,
      },
      readDB: {
        totalProjections: readProjectionsCount,
      },
      lag: writeEventsCount - (status[0]?.total_events_processed || 0),
      isSyncing: this.isSyncing,
    };
  }
}

