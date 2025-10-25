import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Controllers - Este es el que tiene los @MessagePattern
import { UserController } from './infrastructure/controllers/user.controller';

// Command Handlers
import { RegisterUserHandler } from './application/handlers/register-user.handler';

// Repositories
import { UserRepository } from '../shared/domain/repositories/user.repository';
import { UserRepositoryImpl } from '../shared/infrastructure/repositories/user.repository.impl';

// Entities básicas para que TypeORM funcione
import { UserEntity } from '../shared/user.entity';
import { DomainEventEntity } from '../shared/infrastructure/entities/domain-event.entity';
import { UserProjectionEntity } from '../shared/infrastructure/entities/user-projection.entity';

/**
 * UsersModule - Módulo simplificado para Kafka
 * 
 * IMPORTANTE: Este módulo contiene el UserController que tiene los @MessagePattern
 * necesarios para recibir mensajes de Kafka.
 * 
 * El resto de handlers y servicios se pueden agregar gradualmente según se necesiten.
 */
@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    // Write Database entities
    TypeOrmModule.forFeature(
      [UserEntity, DomainEventEntity],
      'write'
    ),
    // Read Database entities
    TypeOrmModule.forFeature(
      [UserProjectionEntity],
      'read'
    ),
  ],
  controllers: [
    UserController, // Contiene los @MessagePattern para Kafka
  ],
  providers: [
    // Command Handlers
    RegisterUserHandler,
    
    // Repositories - usar string como token porque el handler lo inyecta así
    {
      provide: 'UserRepository',
      useClass: UserRepositoryImpl,
    },
  ],
  exports: [],
})
export class UsersModule {}
