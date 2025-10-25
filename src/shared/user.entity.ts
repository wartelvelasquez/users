import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserStatus } from './domain/entities/user.entity';

@Entity('users')
export class UserEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION
  })
  status: UserStatus;

  @Column({ nullable: true })
  phone?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ nullable: true })
  role_id?: string;

  // New fields for user
  @Column({ name: 'trade_name', nullable: true })
  tradeName?: string;

  @Column({ name: 'legal_name', nullable: true })
  legalName?: string;

  @Column({ nullable: true })
  dv?: number;

  @Column({ name: 'email_notification', nullable: true })
  emailNotification?: string;

  @Column({ name: 'indicative_contact', nullable: true })
  indicativeContact?: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId?: number;
}
