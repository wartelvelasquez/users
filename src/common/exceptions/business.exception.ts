import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    errorCode?: string,
    details?: any,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST
  ) {
    super(
      {
        message,
        errorCode: errorCode || 'BUSINESS_ERROR',
        details,
        timestamp: new Date().toISOString(),
        statusCode,
      },
      statusCode
    );
  }
}

export class ValidationException extends BusinessException {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details, HttpStatus.BAD_REQUEST);
  }
}

export class AuthenticationException extends BusinessException {
  constructor(message: string = 'Credenciales inválidas', details?: any) {
    super(message, 'AUTHENTICATION_ERROR', details, HttpStatus.UNAUTHORIZED);
  }
}

export class AuthorizationException extends BusinessException {
  constructor(message: string = 'No autorizado', details?: any) {
    super(message, 'AUTHORIZATION_ERROR', details, HttpStatus.FORBIDDEN);
  }
}

export class NotFoundException extends BusinessException {
  constructor(message: string = 'Recurso no encontrado', details?: any) {
    super(message, 'NOT_FOUND_ERROR', details, HttpStatus.NOT_FOUND);
  }
}

export class ConflictException extends BusinessException {
  constructor(message: string = 'Conflicto de recursos', details?: any) {
    super(message, 'CONFLICT_ERROR', details, HttpStatus.CONFLICT);
  }
}
