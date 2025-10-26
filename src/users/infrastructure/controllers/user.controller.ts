import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../../application/commands/register-user.command';
import { UpdateUserCommand } from '../../application/commands/update-user.command';
import { DeleteUserCommand } from '../../application/commands/delete-user.command';
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
 * - user.delete - Eliminar usuario (soft delete únicamente)
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
    
    this.logger.log(`Received user.create event`);
    this.logger.log(`Creating user: ${data.email}`);
    
    try {
      const command = new RegisterUserCommand(
        data.email,
        data.password,
        data.firstName || '',
        data.lastName || '',
        data.phone
      );

      const result = await this.commandBus.execute(command);
      
      // Verificar si hay errores de validación relacionados con conflictos
      if (!result.success && result.validationErrors) {
        const conflictCodes = ['EMAIL_ALREADY_EXISTS', 'PHONE_ALREADY_EXISTS'];
        const hasConflict = result.validationErrors.errors?.some(
          error => conflictCodes.includes(error.code)
        );
        
        if (hasConflict) {
          const conflictError = result.validationErrors.errors.find(
            error => conflictCodes.includes(error.code)
          );
          
          this.logger.warn(`Conflict detected: ${conflictError.code} - ${conflictError.message}`);
          
          throw new RpcException({
            statusCode: 409,
            message: conflictError.message,
            error: 'Conflict',
            code: conflictError.code,
            field: conflictError.field,
          });
        }
      }
      
      this.logger.log(`User created successfully: ${data.email}`);
      
      return {
        success: result.success,
        message: result.success ? 'Usuario creado exitosamente' : 'Error al crear usuario',
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Si es una RpcException (como 409 Conflict), dejarla pasar sin capturar
      if (error.name === 'RpcException' || error.error) {
        this.logger.warn(`RpcException thrown: ${error.message || error.error}`);
        throw error;
      }
      
      // Para otros errores, loggear y retornar respuesta de error
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
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
   * Obtener todos los usuarios con paginación (sin filtros)
   */
  @MessagePattern('user.findAll')
  async getAllUsers(@Payload() payload: any) {
    // Extraer query del payload enviado por el API Gateway
    const queryParams = payload.query || payload;
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    
    this.logger.log(`Received user.findAll event`);
    this.logger.log(`Getting all users - page: ${page}, limit: ${limit}`);
    
    try {
      // Query simple sin filtros, solo paginación
      const query = new SearchUsersQuery(
        {}, // Sin filtros
        {
          page: Number(page),
          limit: Number(limit)
        }
      );

      const result = await this.queryBus.execute(query);
      
      this.logger.log(`Retrieved ${result.users.length} users of ${result.total} total`);
      
      return {
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        data: {
          users: result.users,
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
      this.logger.error(`Failed to get users: ${error.message}`, error.stack);
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
    
    this.logger.log(`Received user.findById event`);
    this.logger.log(`Getting user by ID: ${userId}`);
    
    try {
      const query = new GetUserProjectionQuery(userId);
      const result = await this.queryBus.execute(query);
      
      this.logger.log(`User found: ${userId}`);
      
      return {
        success: true,
        message: 'Usuario obtenido exitosamente',
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get user ${userId}: ${error.message}`, error.stack);
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
    
    this.logger.log(`Received user.update event`);
    this.logger.log(`Updating user: ${userId}`);
    
    try {
      // Mapear a UpdateUserCommand para compatibilidad
      const command = new UpdateUserCommand(userId, {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
      });
      
      const result = await this.commandBus.execute(command);
      
      this.logger.log(`User updated successfully: ${userId}`);
      
      return {
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to update user ${userId}: ${error.message}`, error.stack);
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
   * Actualiza deleted_at y status a BLOCKED
   */
  @MessagePattern('user.delete')
  async deleteUser(@Payload() payload: any) {
    // Extraer params del payload enviado por el API Gateway
    const params = payload.params || {};
    const userId = params.id;
    
    this.logger.log(`Received user.delete event`);
    this.logger.log(`Deleting user: ${userId}`);
    
    try {
      // Ejecutar comando de soft delete
      const command = new DeleteUserCommand(userId, false);
      const result = await this.commandBus.execute(command);
      
      if (!result.success) {
        this.logger.warn(`Failed to delete user: ${userId}`, result.validationErrors);
        return {
          success: false,
          message: result.message || 'Error al eliminar usuario',
          validationErrors: result.validationErrors,
          timestamp: new Date().toISOString(),
        };
      }
      
      this.logger.log(`User deleted successfully: ${userId}`);
      
      return {
        success: true,
        message: result.message || 'Usuario eliminado exitosamente',
        data: result.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to delete user ${userId}: ${error.message}`, error.stack);
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
    this.logger.log('Received user.health event');
    this.logger.log('Health check requested');
    
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
