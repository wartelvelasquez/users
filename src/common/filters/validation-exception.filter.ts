import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ValidationException } from '../exceptions/business.exception';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToRpc();
    const data = ctx.getData();
    const pattern = ctx.getContext()?.getPattern?.() || 'unknown';
    const response = exception.getResponse();

    let validationErrors: Array<{ field: string; message: string }> = [];
    let message = 'Datos de entrada inválidos';

    // Extraer errores de validación de class-validator
    if (typeof response === 'object' && (response as any).message) {
      const errorMessage = (response as any).message;
      
      if (Array.isArray(errorMessage)) {
        validationErrors = errorMessage.map((error: string) => {
          // Parsear mensajes de error de class-validator
          const parts = error.split(' ');
          const field = parts[0];
          const message = parts.slice(1).join(' ');
          return {
            field,
            message: this.translateValidationMessage(message),
          };
        });
        message = 'Se encontraron errores de validación en los datos enviados';
      } else if (typeof errorMessage === 'string') {
        message = this.translateValidationMessage(errorMessage);
      }
    }

    const errorResponse = {
      success: false,
      error: {
        message,
        errorCode: 'VALIDATION_ERROR',
        details: {
          validationErrors,
          originalMessage: typeof response === 'object' ? (response as any).message : response,
        },
        timestamp: new Date().toISOString(),
        statusCode: 400,
      },
      timestamp: new Date().toISOString(),
      path: pattern,
      requestId: data?.requestId || 'unknown',
    };

    this.logger.warn(
      `Validation Error: ${message}`,
      {
        pattern,
        requestId: data?.requestId,
        validationErrors,
      }
    );

    throw new RpcException(errorResponse);
  }

  private translateValidationMessage(message: string): string {
    const translations: { [key: string]: string } = {
      'should not be empty': 'no debe estar vacío',
      'must be a valid email': 'debe ser un email válido',
      'must be a string': 'debe ser una cadena de texto',
      'must be a number': 'debe ser un número',
      'must be a valid phone number': 'debe ser un número de teléfono válido',
      'must be at least': 'debe tener al menos',
      'must be at most': 'debe tener como máximo',
      'must be longer than': 'debe ser más largo que',
      'must be shorter than': 'debe ser más corto que',
      'must match': 'debe coincidir con',
      'must be one of the following values': 'debe ser uno de los siguientes valores',
      'must be a valid date': 'debe ser una fecha válida',
      'must be a valid UUID': 'debe ser un UUID válido',
    };

    let translatedMessage = message;
    Object.entries(translations).forEach(([english, spanish]) => {
      translatedMessage = translatedMessage.replace(english, spanish);
    });

    return translatedMessage;
  }
}