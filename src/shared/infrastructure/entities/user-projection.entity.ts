import { Entity, PrimaryColumn, Column, Index, UpdateDateColumn } from 'typeorm';

/**
 * UserProjectionEntity - CQRS Read Model for User Queries
 * 
 * Estructura simplificada optimizada para consultas rápidas:
 * - Solo campos esenciales
 * - Denormalización mínima (full_name)
 * - Campos calculados (profile_completion)
 * - Roles y permisos en JSONB para flexibilidad
 * 
 * Sincronizado con User Domain Entity y migraciones
 */
@Entity('user')
@Index(['email'], { unique: true })
@Index(['status'])
@Index(['createdAt'])
@Index(['lastLoginAt'])
export class UserProjectionEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ name: 'full_name', type: 'varchar' })
  fullName: string;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  phone?: string;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'jsonb', nullable: true })
  roles?: any[];

  @Column({ type: 'jsonb', nullable: true })
  permissions?: string[];

  @Column({ name: 'profile_completion', type: 'int', default: 0 })
  profileCompletion: number;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Calculate profile completion percentage based on available fields
   */
  calculateProfileCompletion(): number {
    let completion = 0;
    const totalFields = 5; // Total essential fields

    // Essential fields
    if (this.email) completion++;
    if (this.fullName) completion++;
    if (this.phone) completion++;
    if (this.status) completion++;
    if (this.lastLoginAt) completion++;

    return Math.round((completion / totalFields) * 100);
  }

  /**
   * Update profile completion field
   */
  updateProfileCompletion(): void {
    this.profileCompletion = this.calculateProfileCompletion();
  }
}
