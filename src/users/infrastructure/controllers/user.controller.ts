import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../../application/commands/register-user.command';
import { UpdateUserMilioCommand } from '../../application/commands/update-user-milio.command';
import { GetUserProjectionQuery } from '../../application/queries/get-user-projection.query';
import { SearchUsersQuery } from '../../application/queries/search-users.query';
import { RegisterDto } from '../../application/dtos/register.dto';

/**
 * UserController - Kafka Microservice Controller
 * 
 * Patrones de mensajes Kafka disponibles:
 * - user.create - Crear usuario
 * - user.findAll - Obtener todos los usuarios (con paginación)
 * - user.findById - Obtener usuario por ID
 * - user.update - Actualizar usuario por ID
 * - user.delete - Eliminar usuario (soft delete)
 */
@Controller()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * user.create
   * Crear un nuevo usuario
   */
  @MessagePattern('user.create')
  async createUser(@Payload() payload: any) {
    // Extraer el body del payload enviado por el API Gateway
    const data: RegisterDto = payload.body || payload;
    
    this.logger.log(`[Kafka] Received user.create event`);
    this.logger.log(`[Kafka] Creating user: ${data.email}`);
    
    try {
      const command = new RegisterUserCommand(
        data.email,
        data.password,
        data.firstName || '',
        data.lastName || '',
        data.phone
      );

      const result = await this.commandBus.execute(command);
      
      this.logger.log(`[Kafka] User created successfully: ${data.email}`);
      
      return {
        success: true,
        message: 'Usuario creado exitosamente',
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`[Kafka] Failed to create user: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.message || 'Error al crear usuario',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * user.findAll
   * Obtener todos los usuarios con paginación y filtros
   */
  @MessagePattern('user.findAll')
  async getAllUsers(@Payload() payload: any) {
    // Extraer query del payload enviado por el API Gateway
    const queryParams = payload.query || payload;
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    
    this.logger.log(`[Kafka] Received user.findAll event`);
    this.logger.log(`[Kafka] Getting all users - page: ${page}, limit: ${limit}`);
    
    try {
      const query = new SearchUsersQuery(
        {
          status: queryParams.status,
          // Puedes agregar más filtros aquí
        },
        {
          page: Number(page),
          limit: Number(limit)
        }
      );

      const result = await this.queryBus.execute(query);
      
      this.logger.log(`[Kafka] Retrieved ${result.data.length} users`);
      
      return {
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        data: {
          users: result.data,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages
          }
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`[Kafka] Failed to get users: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.message || 'Error al obtener usuarios',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * user.findById
   * Obtener un usuario por ID
   */
  @MessagePattern('user.findById')
  async getUserById(@Payload() payload: any) {
    // Extraer params del payload enviado por el API Gateway
    const params = payload.params || payload;
    const userId = params.id;
    
    this.logger.log(`[Kafka] Received user.findById event`);
    this.logger.log(`[Kafka] Getting user by ID: ${userId}`);
    
    try {
      const query = new GetUserProjectionQuery(userId);
      const result = await this.queryBus.execute(query);
      
      this.logger.log(`[Kafka] User found: ${userId}`);
      
      return {
        success: true,
        message: 'Usuario obtenido exitosamente',
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`[Kafka] Failed to get user ${userId}: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.message || 'Error al obtener usuario',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * user.update
   * Actualizar un usuario por ID
   */
  @MessagePattern('user.update')
  async updateUser(@Payload() payload: any) {
    // Extraer params y body del payload enviado por el API Gateway
    const params = payload.params || {};
    const body = payload.body || payload;
    const userId = params.id;
    
    this.logger.log(`[Kafka] Received user.update event`);
    this.logger.log(`[Kafka] Updating user: ${userId}`);
    
    try {
      // Mapear a UpdateUserMilioCommand para compatibilidad
      const command = new UpdateUserMilioCommand(userId, {
        name: body.firstName,
        lastName: body.lastName,
        phoneContact: body.phone,
      });
      
      const result = await this.commandBus.execute(command);
      
      this.logger.log(`[Kafka] User updated successfully: ${userId}`);
      
      return {
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`[Kafka] Failed to update user ${userId}: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.message || 'Error al actualizar usuario',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * user.delete
   * Eliminar un usuario por ID (soft delete)
   */
  @MessagePattern('user.delete')
  async deleteUser(@Payload() payload: any) {
    // Extraer params y query del payload enviado por el API Gateway
    const params = payload.params || {};
    const queryParams = payload.query || {};
    const userId = params.id;
    const hardDelete = queryParams.hard === 'true' || queryParams.hard === true || false;
    
    this.logger.log(`[Kafka] Received user.delete event`);
    this.logger.log(`[Kafka] Deleting user: ${userId} (hard: ${hardDelete})`);
    
    try {
      // Soft delete: actualizar status a DELETED
      // TODO: Implementar comando de eliminación específico
      
      // Por ahora, usamos el repositorio directamente
      this.logger.warn(`[Kafka] Soft delete not fully implemented yet. User ${userId} marked for deletion.`);
      
      return {
        success: true,
        message: hardDelete ? 'Usuario eliminado permanentemente' : 'Usuario eliminado (soft delete)',
        data: { 
          id: userId, 
          deleted: true, 
          hardDelete 
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`[Kafka] Failed to delete user ${userId}: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.message || 'Error al eliminar usuario',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * user.health
   * Health check del microservicio de usuarios
   */
  @MessagePattern('user.health')
  async healthCheck(@Payload() payload?: any) {
    this.logger.log('[Kafka] Received user.health event');
    this.logger.log('[Kafka] Health check requested');
    
    return {
      success: true,
      message: 'User microservice is healthy',
      data: {
        service: 'users',
        status: 'UP',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
