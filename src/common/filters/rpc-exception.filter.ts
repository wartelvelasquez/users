import { Catch, RpcExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

/**
 * Filtro global para excepciones en microservicios Kafka
 * 
 * Este filtro captura todas las excepciones y las formatea correctamente
 * para que puedan ser serializadas y enviadas de vuelta al cliente a través de Kafka.
 */
@Catch()
export class AllRpcExceptionsFilter implements RpcExceptionFilter<RpcException> {
  private readonly logger = new Logger(AllRpcExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    const ctx = host.switchToRpc();
    const data = ctx.getData();

    // Log detallado del error
    this.logger.warn('='.repeat(60));
    this.logger.warn('RPC Exception caught');
    this.logger.warn(`Message pattern: ${JSON.stringify(data)}`);
    this.logger.warn(`Exception type: ${exception?.constructor?.name}`);
    this.logger.warn(`Exception message: ${exception?.message}`);
    
    if (exception?.stack) {
      this.logger.warn(`Stack trace: ${exception.stack}`);
    }
    
    if (exception?.response) {
      this.logger.error(`Response: ${JSON.stringify(exception.response)}`);
    }
    this.logger.warn('='.repeat(60));

    // Formatear error para serialización
    const error = this.formatError(exception);
    
    return throwError(() => error);
  }

  private formatError(exception: any): any {
    // 1. Si el error ya tiene statusCode explícito (de RpcException del controller)
    if (exception?.statusCode) {
      return {
        statusCode: exception.statusCode,
        message: exception.message || 'Internal server error',
        error: exception.error || exception.name || 'Error',
        timestamp: new Date().toISOString(),
      };
    }

    // 2. Si es una RpcException con getError() que contiene statusCode
    if (typeof exception?.getError === 'function') {
      const error = exception.getError();
      if (typeof error === 'object' && error.statusCode) {
        return {
          statusCode: error.statusCode,
          message: error.message || 'Internal server error',
          error: error.error || 'Error',
          timestamp: new Date().toISOString(),
        };
      }
    }

    // 3. Si es una HttpException de NestJS
    if (typeof exception?.getStatus === 'function') {
      return {
        statusCode: exception.getStatus(),
        message: exception.message || 'Internal server error',
        error: exception.name || 'Error',
        timestamp: new Date().toISOString(),
      };
    }

    // 4. Si es una excepción de NestJS con response
    if (exception?.response) {
      const response = exception.response;
      
      // Si response es un objeto con message
      if (typeof response === 'object') {
        return {
          statusCode: exception.status || exception.statusCode || 500,
          message: Array.isArray(response.message) 
            ? response.message 
            : typeof response.message === 'string'
            ? response.message
            : response.error || 'Internal server error',
          error: response.error || exception.name || 'Error',
          timestamp: new Date().toISOString(),
        };
      }
      
      // Si response es un string
      if (typeof response === 'string') {
        return {
          statusCode: exception.status || exception.statusCode || 500,
          message: response,
          error: exception.name || 'Error',
          timestamp: new Date().toISOString(),
        };
      }
    }

    // 5. Si es una excepción de TypeORM o base de datos
    if (exception?.code) {
      return {
        statusCode: 500,
        message: this.getDatabaseErrorMessage(exception),
        error: 'DatabaseError',
        code: exception.code,
        timestamp: new Date().toISOString(),
      };
    }

    // 6. Si es una excepción de validación
    if (exception?.name === 'ValidationError') {
      return {
        statusCode: 400,
        message: 'Validation failed',
        errors: exception.errors || [],
        error: 'ValidationError',
        timestamp: new Date().toISOString(),
      };
    }

    // 7. Error genérico
    return {
      statusCode: 500,
      message: exception?.message || 'Internal server error',
      error: exception?.name || 'Error',
      timestamp: new Date().toISOString(),
    };
  }

  private getDatabaseErrorMessage(exception: any): string {
    // Códigos de error comunes de PostgreSQL
    const errorMessages: Record<string, string> = {
      '23505': 'El registro ya existe (duplicado)',
      '23503': 'Violación de clave foránea',
      '23502': 'Violación de NOT NULL',
      '23514': 'Violación de restricción CHECK',
      '22P02': 'Formato de dato inválido',
      '42P01': 'Tabla no existe',
      '42703': 'Columna no existe',
    };

    const code = exception.code;
    const message = errorMessages[code] || exception.message || 'Error de base de datos';
    
    // Agregar detalles adicionales si están disponibles
    if (exception.detail) {
      return `${message}: ${exception.detail}`;
    }
    
    return message;
  }
}

