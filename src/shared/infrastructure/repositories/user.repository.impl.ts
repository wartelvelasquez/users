import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User, UserStatus } from '../../domain/entities/user.entity';
import { UserEntity } from '../../user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email } from '../../domain/value-objects/email.vo';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(
    @InjectRepository(UserEntity, 'write')
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async save(user: User): Promise<void> {
    const userEntity = new UserEntity();
    userEntity.id = user.id.value;
    userEntity.email = user.email.value;
    userEntity.password = user.password.value;
    userEntity.firstName = user.firstName.value;
    userEntity.lastName = user.lastName.value;
    userEntity.phone = user.phone?.value;
    userEntity.status = user.status;
    userEntity.lastLoginAt = user.lastLoginAt;
    userEntity.role_id = user.roleId?.value;
    
    await this.userRepository.save(userEntity);
  }

  async findById(id: UserId): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { id: id.value } });
    if (!userEntity) return null;
    
    return User.fromPersistence(
      userEntity.id,
      userEntity.email,
      userEntity.password,
      userEntity.firstName,
      userEntity.lastName,
      userEntity.phone,
      [], // roles - empty for now
      userEntity.status as UserStatus,
      userEntity.lastLoginAt,
      userEntity.role_id,
      userEntity.createdAt?.toISOString(),
      userEntity.updatedAt?.toISOString(),
    );
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { email: email.value } });
    if (!userEntity) return null;
    
    return User.fromPersistence(
      userEntity.id,
      userEntity.email,
      userEntity.password,
      userEntity.firstName,
      userEntity.lastName,
      userEntity.phone,
      [], // roles - empty for now
      userEntity.status as UserStatus,
      userEntity.lastLoginAt,
      userEntity.role_id,
      userEntity.createdAt?.toISOString(),
      userEntity.updatedAt?.toISOString(),
    );
  }


  async findByPhoneNumber(phone: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ 
      where: { phone } 
    });
    if (!userEntity) return null;
    
    
    return User.fromPersistence(
      userEntity.id,
      userEntity.email,
      userEntity.password,
      userEntity.firstName,
      userEntity.lastName,
      userEntity.phone,
      [], // roles - empty for now
      userEntity.status as UserStatus,
      userEntity.lastLoginAt,
      userEntity.role_id,
      userEntity.createdAt?.toISOString(),
      userEntity.updatedAt?.toISOString(),
    );
  }

  async findByRole(roleId: string): Promise<User[]> {
    // Note: User entity doesn't have roleId property
    // This would need to be implemented based on your role system
    // For now, return empty array
    return [];
  }

  async search(criteria: any, options?: any): Promise<any> {
    // Basic implementation - you can enhance this based on your needs
    const query = this.userRepository.createQueryBuilder('user');
    
    if (criteria.email) {
      query.andWhere('user.email = :email', { email: criteria.email });
    }
    
    if (criteria.firstName) {
      query.andWhere("user.profile->>'firstName' ILIKE :firstName", { firstName: `%${criteria.firstName}%` });
    }
    
    if (criteria.lastName) {
      query.andWhere("user.profile->>'lastName' ILIKE :lastName", { lastName: `%${criteria.lastName}%` });
    }
    
    if (criteria.status) {
      query.andWhere('user.status = :status', { status: criteria.status });
    }
    
    
    if (options?.sortBy) {
      const order = options.sortOrder === 'desc' ? 'DESC' : 'ASC';
      query.orderBy(`user.${options.sortBy}`, order);
    }
    
    if (options?.limit) {
      query.limit(options.limit);
    }
    
    if (options?.offset) {
      query.offset(options.offset);
    }
    
    const [userEntities, total] = await query.getManyAndCount();
    
    const users = userEntities.map(entity => User.fromPersistence(
      entity.id,
      entity.email,
      entity.password,
      entity.firstName,
      entity.lastName,
      entity.phone,
      [], // roles - empty for now
      entity.status as UserStatus,
      entity.lastLoginAt,
      entity.role_id,
      entity.createdAt?.toISOString(),
      entity.updatedAt?.toISOString(),
    ));
    
    return {
      users,
      total,
      hasMore: options?.limit ? total > (options.offset || 0) + options.limit : false,
    };
  }

  async emailExists(email: Email): Promise<boolean> {
    const count = await this.userRepository.count({ where: { email: email.value } });
    return count > 0;
  }


  async delete(id: UserId): Promise<void> {
    await this.userRepository.delete(id.value);
  }

  async count(): Promise<number> {
    return await this.userRepository.count();
  }

  async countByStatus(status: string): Promise<number> {
    return await this.userRepository.count({ where: { status: status as UserStatus } });
  }

  async findUnverifiedUsersOlderThan(date: Date): Promise<User[]> {
    const userEntities = await this.userRepository.find({
      where: {
        status: UserStatus.PENDING_VERIFICATION,
        createdAt: { $lt: date } as any,
      },
    });
    
    return userEntities.map(entity => User.fromPersistence(
      entity.id,
      entity.email,
      entity.password,
      entity.firstName,
      entity.lastName,
      entity.phone,
      [], // roles - empty for now
      entity.status as UserStatus,
      entity.lastLoginAt,
      entity.role_id,
      entity.createdAt?.toISOString(),
      entity.updatedAt?.toISOString(),
    ));
  }

  async findByIds(ids: UserId[]): Promise<User[]> {
    const idValues = ids.map(id => id.value);
    const userEntities = await this.userRepository.findByIds(idValues);
    
    return userEntities.map(entity => User.fromPersistence(
      entity.id,
      entity.email,
      entity.password,
      entity.firstName,
      entity.lastName,
      entity.phone,
      [], // roles - empty for now
      entity.status as UserStatus,
      entity.lastLoginAt,
      entity.role_id,
      entity.createdAt?.toISOString(),
      entity.updatedAt?.toISOString(),
    ));
  }

  async updateLastLogin(id: UserId, timestamp: Date): Promise<void> {
    // Note: lastLogin is no longer a separate field, it's part of the profile
    // You might want to add this field back to the persistence entity if needed
    // For now, we'll skip this update
  }


  async updateProfile(id: UserId, profileData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    status?: string;
  }): Promise<void> {
    const updateData: any = {};

    if (profileData.firstName !== undefined) {
      updateData.firstName = profileData.firstName;
    }
    if (profileData.lastName !== undefined) {
      updateData.lastName = profileData.lastName;
    }
    if (profileData.phone !== undefined) {
      updateData.phone = profileData.phone;
    }
    if (profileData.status !== undefined) {
      updateData.status = profileData.status;
    }

    if (Object.keys(updateData).length > 0) {
      await this.userRepository.update(id.value, updateData);
    }
  }

  async bulkUpdateStatus(ids: UserId[], status: string): Promise<void> {
    const idValues = ids.map(id => id.value);
    await this.userRepository.update(idValues, { status: status as UserStatus });
  }

  async findCreatedBetween(startDate: Date, endDate: Date): Promise<User[]> {
    const userEntities = await this.userRepository.find({
      where: {
        createdAt: { $gte: startDate, $lte: endDate } as any,
      },
    });
    
    return userEntities.map(entity => User.fromPersistence(
      entity.id,
      entity.email,
      entity.password,
      entity.firstName,
      entity.lastName,
      entity.phone,
      [], // roles - empty for now
      entity.status as UserStatus,
      entity.lastLoginAt,
      entity.role_id,
      entity.createdAt?.toISOString(),
      entity.updatedAt?.toISOString(),
    ));
  }

  async getStatistics(): Promise<any> {
    const total = await this.userRepository.count();
    const active = await this.userRepository.count({ where: { status: UserStatus.ACCEPTED } });
    const inactive = await this.userRepository.count({ where: { status: UserStatus.INACTIVE } });
    const suspended = await this.userRepository.count({ where: { status: UserStatus.SUSPENDED } });
    const pendingVerification = await this.userRepository.count({ where: { status: UserStatus.PENDING_VERIFICATION } });
    const verifiedEmails = await this.userRepository.count({ where: { status: UserStatus.ACCEPTED } });
    const unverifiedEmails = await this.userRepository.count({ where: { status: UserStatus.PENDING_VERIFICATION } });
    
    return {
      total,
      active,
      inactive,
      suspended,
      pendingVerification,
      verifiedEmails,
      unverifiedEmails,
    };
  }

  async updateUserForProvider(id: string, updateFields: any): Promise<void> {
    try {
      // First, find the user entity
      const userEntity = await this.userRepository.findOne({ where: { id } });
      if (!userEntity) {
        throw new Error(`User with id ${id} not found`);
      }
      
      // Update the entity with new fields
      Object.assign(userEntity, updateFields);
      
      // Save the updated entity
      await this.userRepository.save(userEntity);
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  }
}
