import { HttpException, HttpStatus } from '@nestjs/common';

export class ServerException extends HttpException {
  constructor(
    message: string = 'Error interno del servidor',
    errorCode?: string,
    details?: any,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    super(
      {
        message,
        errorCode: errorCode || 'SERVER_ERROR',
        details,
        timestamp: new Date().toISOString(),
        statusCode,
      },
      statusCode
    );
  }
}

export class DatabaseException extends ServerException {
  constructor(message: string = 'Error de base de datos', details?: any) {
    super(message, 'DATABASE_ERROR', details, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class ExternalServiceException extends ServerException {
  constructor(message: string = 'Error en servicio externo', details?: any) {
    super(message, 'EXTERNAL_SERVICE_ERROR', details, HttpStatus.BAD_GATEWAY);
  }
}

export class ConfigurationException extends ServerException {
  constructor(message: string = 'Error de configuración', details?: any) {
    super(message, 'CONFIGURATION_ERROR', details, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
