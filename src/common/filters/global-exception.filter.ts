import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { BusinessException, ServerException } from '../exceptions';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToRpc();
    const data = ctx.getData();
    const pattern = ctx.getContext()?.getPattern?.() || 'unknown';

    let errorResponse: any;

    if (exception instanceof BusinessException || exception instanceof ServerException) {
      // Manejar excepciones personalizadas
      errorResponse = {
        success: false,
        error: exception.getResponse(),
        timestamp: new Date().toISOString(),
        path: pattern,
        requestId: data?.requestId || 'unknown',
      };

      this.logger.warn(
        `Business/Server Exception: ${exception.message}`,
        {
          pattern,
          requestId: data?.requestId,
          error: exception.getResponse(),
        }
      );
    } else if (exception instanceof HttpException) {
      // Manejar excepciones HTTP estándar de NestJS
      const status = exception.getStatus();
      const response = exception.getResponse();

      errorResponse = {
        success: false,
        error: {
          message: typeof response === 'string' ? response : (response as any).message,
          errorCode: this.getErrorCodeFromStatus(status),
          details: typeof response === 'object' ? response : null,
          timestamp: new Date().toISOString(),
          statusCode: status,
        },
        timestamp: new Date().toISOString(),
        path: pattern,
        requestId: data?.requestId || 'unknown',
      };

      this.logger.warn(
        `HTTP Exception: ${exception.message}`,
        {
          pattern,
          requestId: data?.requestId,
          status,
          response,
        }
      );
    } else if (exception instanceof RpcException) {
      // Manejar excepciones RPC
      const rpcError = exception.getError();
      
      errorResponse = {
        success: false,
        error: {
          message: typeof rpcError === 'string' ? rpcError : 'Error RPC',
          errorCode: 'RPC_ERROR',
          details: typeof rpcError === 'object' ? rpcError : null,
          timestamp: new Date().toISOString(),
          statusCode: HttpStatus.BAD_REQUEST,
        },
        timestamp: new Date().toISOString(),
        path: pattern,
        requestId: data?.requestId || 'unknown',
      };

      this.logger.warn(
        `RPC Exception: ${typeof rpcError === 'string' ? rpcError : 'Unknown RPC error'}`,
        {
          pattern,
          requestId: data?.requestId,
          rpcError,
        }
      );
    } else {
      // Manejar errores no controlados
      const error = exception as Error;
      
      errorResponse = {
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
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        timestamp: new Date().toISOString(),
        path: pattern,
        requestId: data?.requestId || 'unknown',
      };

      this.logger.error(
        `Unhandled Exception: ${error.message}`,
        error.stack,
        {
          pattern,
          requestId: data?.requestId,
          error: {
            name: error.name,
            message: error.message,
          },
        }
      );
    }

    // En microservicios con Kafka, lanzamos una RpcException con la respuesta de error
    throw new RpcException(errorResponse);
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';
      case HttpStatus.BAD_GATEWAY:
        return 'BAD_GATEWAY';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'UNKNOWN_ERROR';
    }
  }
}
