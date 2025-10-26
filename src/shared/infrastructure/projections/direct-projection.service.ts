import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserProjectionEntity } from '../entities/user-projection.entity';

/**
 * DirectProjectionService - Proyección Directa para Base de Lectura
 * 
 * Este servicio maneja la actualización directa de la base de datos de lectura
 * sin necesidad de procesamiento de eventos asíncrono.
 * 
 * Cada handler es responsable de actualizar ambas bases de datos:
 * - Write DB: Estado actual del usuario
 * - Read DB: Proyección para consultas
 */
@Injectable()
export class DirectProjectionService {
  private readonly logger = new Logger(DirectProjectionService.name);

  constructor(
    @InjectDataSource('read')
    private readonly readDataSource: DataSource,
  ) {}

  /**
   * Crear o actualizar proyección de usuario
   */
  async createOrUpdateUserProjection(userData: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Promise<void> {
    try {
      const fullName = `${userData.firstName} ${userData.lastName}`.trim();
      const now = new Date();

      await this.readDataSource
        .createQueryBuilder()
        .insert()
        .into(UserProjectionEntity)
        .values({
          id: userData.id,
          email: userData.email,
          fullName,
          phone: userData.phone,
          status: userData.status,
          failedLoginAttempts: 0,
          profileCompletion: 20, // Base completion
          createdAt: userData.createdAt || now,
          updatedAt: userData.updatedAt || now,
        })
        .orUpdate([
          'email', 'fullName', 'phone', 'status', 'updatedAt'
        ], ['id'])
        .execute();

      this.logger.log(`✅ User projection created/updated: ${userData.id}`);
    } catch (error) {
      this.logger.error(`❌ Failed to create/update user projection: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Actualizar perfil de usuario en proyección
   */
  async updateUserProfile(userId: string, changes: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<void> {
    try {
      // Primero obtener la proyección actual para calcular el nombre completo
      const currentProjection = await this.readDataSource
        .getRepository(UserProjectionEntity)
        .findOne({ where: { id: userId } });

      if (!currentProjection) {
        this.logger.warn(`⚠️ Projection not found for user ${userId}, skipping update`);
        return;
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      // Actualizar full_name si firstName o lastName cambian
      if (changes.firstName || changes.lastName) {
        const currentName = currentProjection.fullName ? currentProjection.fullName.split(' ') : ['', ''];
        const firstName = changes.firstName || currentName[0] || '';
        const lastName = changes.lastName || currentName.slice(1).join(' ') || '';
        updateData.fullName = `${firstName} ${lastName}`.trim();
      }

      if (changes.phone !== undefined) {
        updateData.phone = changes.phone;
      }

      // Solo actualizar si hay campos para actualizar
      if (Object.keys(updateData).length > 1) { // updatedAt siempre está presente
        await this.readDataSource
          .createQueryBuilder()
          .update(UserProjectionEntity)
          .set(updateData)
          .where('id = :userId', { userId })
          .execute();

        this.logger.log(`✅ User profile projection updated: ${userId}`);
      } else {
        this.logger.debug(`No profile changes to update for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to update user profile projection: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Marcar usuario como eliminado en proyección
   */
  async markUserAsDeleted(userId: string): Promise<void> {
    try {
      await this.readDataSource
        .createQueryBuilder()
        .update(UserProjectionEntity)
        .set({
          deletedAt: new Date(),
          status: 'DELETE',
          updatedAt: new Date(),
        })
        .where('id = :userId', { userId })
        .execute();

      this.logger.log(`✅ User marked as deleted in projection: ${userId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to mark user as deleted in projection: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Actualizar estado de usuario en proyección
   */
  async updateUserStatus(userId: string, status: string): Promise<void> {
    try {
      await this.readDataSource
        .createQueryBuilder()
        .update(UserProjectionEntity)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where('id = :userId', { userId })
        .execute();

      this.logger.log(`✅ User status updated in projection: ${userId} -> ${status}`);
    } catch (error) {
      this.logger.error(`❌ Failed to update user status in projection: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verificar si existe proyección de usuario
   */
  async userProjectionExists(userId: string): Promise<boolean> {
    try {
      const count = await this.readDataSource
        .getRepository(UserProjectionEntity)
        .count({ where: { id: userId } });

      return count > 0;
    } catch (error) {
      this.logger.error(`❌ Failed to check user projection existence: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtener proyección de usuario
   */
  async getUserProjection(userId: string): Promise<UserProjectionEntity | null> {
    try {
      return await this.readDataSource
        .getRepository(UserProjectionEntity)
        .findOne({ where: { id: userId } });
    } catch (error) {
      this.logger.error(`❌ Failed to get user projection: ${error.message}`);
      return null;
    }
  }
}