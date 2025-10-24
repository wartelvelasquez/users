import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProjectionEntity } from '../../../shared/infrastructure/entities/user-projection.entity';

/**
 * UserProjectionService - Manages User Projections
 * 
 * Servicio simplificado para manejar proyecciones CQRS
 * Solo campos esenciales - Sincronizado con UserProjectionEntity
 */
@Injectable()
export class UserProjectionService {
  private readonly logger = new Logger(UserProjectionService.name);

  constructor(
    @InjectRepository(UserProjectionEntity, 'read')
    private readonly projectionRepository: Repository<UserProjectionEntity>,
  ) {}

  /**
   * Create a new user projection
   */
  async createProjection(data: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    phone?: string;
    createdAt: Date;
  }): Promise<UserProjectionEntity> {
    try {
      const projection = this.projectionRepository.create({
        id: data.id,
        email: data.email,
        fullName: `${data.firstName} ${data.lastName}`,
        status: data.status,
        phone: data.phone,
        failedLoginAttempts: 0,
        profileCompletion: 0,
        createdAt: data.createdAt,
        updatedAt: new Date(),
      });
      
      projection.updateProfileCompletion();
      
      const saved = await this.projectionRepository.save(projection);
      
      this.logger.log(`Created projection for user ${data.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create projection for user ${data.id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user status
   */
  async updateStatus(userId: string, status: string): Promise<void> {
    try {
      await this.projectionRepository.update(
        { id: userId },
        { status, updatedAt: new Date() },
      );
      
      this.logger.log(`Updated status for user ${userId}: ${status}`);
    } catch (error) {
      this.logger.error(`Failed to update status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update login information
   */
  async updateLoginInfo(
    userId: string,
    loginData: {
      lastLoginAt: Date;
      resetFailedAttempts?: boolean;
    },
  ): Promise<void> {
    try {
      const projection = await this.projectionRepository.findOne({
        where: { id: userId },
      });

      if (!projection) {
        this.logger.warn(`Projection not found for user ${userId}`);
        return;
      }

      projection.lastLoginAt = loginData.lastLoginAt;

      if (loginData.resetFailedAttempts) {
        projection.failedLoginAttempts = 0;
      }

      projection.updatedAt = new Date();
      
      await this.projectionRepository.save(projection);
      
      this.logger.log(`Updated login info for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to update login info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedLoginAttempts(userId: string): Promise<void> {
    try {
      const projection = await this.projectionRepository.findOne({
        where: { id: userId },
      });

      if (!projection) {
        return;
      }

      projection.failedLoginAttempts += 1;
      projection.updatedAt = new Date();
      
      await this.projectionRepository.save(projection);
      
      this.logger.log(`Incremented failed login attempts for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to increment failed attempts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user profile (full_name and phone)
   */
  async updateProfile(
    userId: string,
    profileData: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
  ): Promise<void> {
    try {
      const projection = await this.projectionRepository.findOne({
        where: { id: userId },
      });

      if (!projection) {
        this.logger.warn(`Projection not found for user ${userId}`);
        return;
      }

      // Update full_name if firstName or lastName provided
      if (profileData.firstName || profileData.lastName) {
        const currentName = projection.fullName.split(' ');
        const firstName = profileData.firstName || currentName[0] || '';
        const lastName = profileData.lastName || currentName.slice(1).join(' ') || '';
        projection.fullName = `${firstName} ${lastName}`.trim();
      }

      if (profileData.phone !== undefined) {
        projection.phone = profileData.phone;
      }

      projection.updateProfileCompletion();
      projection.updatedAt = new Date();
      
      await this.projectionRepository.save(projection);
      
      this.logger.log(`Updated profile for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to update profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update roles and permissions
   */
  async updateRolesAndPermissions(
    userId: string,
    roles: any[],
    permissions: string[],
  ): Promise<void> {
    try {
      await this.projectionRepository.update(
        { id: userId },
        { roles, permissions, updatedAt: new Date() },
      );
      
      this.logger.log(`Updated roles and permissions for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to update roles: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a projection
   */
  async deleteProjection(userId: string): Promise<void> {
    try {
      await this.projectionRepository.delete({ id: userId });
      this.logger.log(`Deleted projection for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete projection: ${error.message}`);
      throw error;
    }
  }
}
