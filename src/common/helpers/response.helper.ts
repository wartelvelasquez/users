import { RpcException } from '@nestjs/microservices';
import { 
  BusinessException, 
  ValidationException, 
  AuthenticationException, 
  AuthorizationException,
  NotFoundException,
  ConflictException,
  ServerException,
  DatabaseException,
  ExternalServiceException,
  ConfigurationException
} from '../exceptions';

export class ResponseHelper {
  static createSuccessResponse(data: any, message: string, statusCode: number = 200, requestId?: string) {
    return {
      success: true,
      message,
      data,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId: requestId || 'unknown',
    };
  }

  static createErrorResponse(
    message: string, 
    errorCode: string, 
    statusCode: number, 
    details?: any, 
    requestId?: string
  ) {
    const errorResponse = {
      success: false,
      error: {
        message,
        errorCode,
        details,
        timestamp: new Date().toISOString(),
        statusCode,
      },
      timestamp: new Date().toISOString(),
      requestId: requestId || 'unknown',
    };

    throw new RpcException(errorResponse);
  }

  static handleError(error: any, requestId?: string): never {
    // Si ya es una excepción personalizada, la re-lanzamos
    if (error instanceof BusinessException || 
        error instanceof ValidationException || 
        error instanceof AuthenticationException || 
        error instanceof AuthorizationException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ServerException ||
        error instanceof DatabaseException ||
        error instanceof ExternalServiceException ||
        error instanceof ConfigurationException) {
      
      const errorResponse = {
        success: false,
        error: error.getResponse(),
        timestamp: new Date().toISOString(),
        requestId: requestId || 'unknown',
      };

      throw new RpcException(errorResponse);
    }

    // Si es una RpcException, la re-lanzamos tal como está
    if (error.name === 'RpcException') {
      throw error;
    }

    // Para otros errores, crear una respuesta de error genérica
    const errorResponse = {
      success: false,
      error: {
        message: 'Error interno del servidor',
        errorCode: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          name: error.name,
          message: error.message,
        } : null,
        timestamp: new Date().toISOString(),
        statusCode: 500,
      },
      timestamp: new Date().toISOString(),
      requestId: requestId || 'unknown',
    };

    throw new RpcException(errorResponse);
  }
}
