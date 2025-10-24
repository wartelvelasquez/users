/**
 * Ejemplos de uso del sistema de manejo de errores
 * 
 * Este archivo muestra cómo usar las diferentes excepciones personalizadas
 * en el microservicio de autenticación.
 */

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
  ConfigurationException,
} from '../exceptions';

export class ErrorHandlingExamples {
  
  /**
   * Ejemplo de manejo de errores de validación (400)
   */
  static async validateUserData(userData: any) {
    if (!userData.email) {
      throw new ValidationException('El email es requerido');
    }
    
    if (!userData.password || userData.password.length < 8) {
      throw new ValidationException('La contraseña debe tener al menos 8 caracteres');
    }
    
    // Ejemplo con múltiples errores de validación
    const errors: Array<{ field: string; message: string }> = [];
    if (!userData.firstName) errors.push({ field: 'firstName', message: 'El nombre es requerido' });
    if (!userData.lastName) errors.push({ field: 'lastName', message: 'El apellido es requerido' });
    
    if (errors.length > 0) {
      throw new ValidationException('Datos de usuario inválidos', errors);
    }
  }

  /**
   * Ejemplo de manejo de errores de autenticación (401)
   */
  static async authenticateUser(email: string, password: string) {
    const user: any = await this.findUserByEmail(email);
    
    if (!user) {
      throw new AuthenticationException('Credenciales inválidas. Verifique su email y contraseña.');
    }
    
    if (!user.isActive) {
      throw new AuthenticationException('Su cuenta está desactivada. Contacte al administrador.');
    }
    
    if (!await this.verifyPassword(password, user.password)) {
      throw new AuthenticationException('Credenciales inválidas. Verifique su email y contraseña.');
    }
  }

  /**
   * Ejemplo de manejo de errores de autorización (403)
   */
  static async checkUserPermissions(userId: string, requiredPermission: string) {
    const user: any = await this.findUserById(userId);
    
    if (!user.hasPermission(requiredPermission)) {
      throw new AuthorizationException(
        `No tiene permisos para realizar esta acción. Se requiere: ${requiredPermission}`
      );
    }
  }

  /**
   * Ejemplo de manejo de errores de recurso no encontrado (404)
   */
  static async findUserByIdExample(userId: string) {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }
    
    return user;
  }

  /**
   * Ejemplo de manejo de errores de conflicto (409)
   */
  static async createUser(userData: any) {
    const existingUser = await this.findUserByEmail(userData.email);
    
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este email');
    }
    
    // Continuar con la creación del usuario...
  }

  /**
   * Ejemplo de manejo de errores de base de datos (500)
   */
  static async saveUserToDatabase(user: any) {
    try {
      await this.database.save(user);
    } catch (error) {
      throw new DatabaseException(
        'Error al guardar el usuario en la base de datos',
        { originalError: error.message, userId: user.id }
      );
    }
  }

  /**
   * Ejemplo de manejo de errores de servicios externos (502)
   */
  static async callExternalService(serviceUrl: string, data: any) {
    try {
      const response: any = await this.httpClient.post(serviceUrl, data);
      return response.data;
    } catch (error) {
      throw new ExternalServiceException(
        'Error al comunicarse con el servicio externo',
        { serviceUrl, statusCode: error.response?.status, data }
      );
    }
  }

  /**
   * Ejemplo de manejo de errores de configuración (500)
   */
  static async validateConfiguration() {
    const requiredConfig = ['JWT_SECRET', 'DATABASE_URL', 'KAFKA_BROKER'];
    
    for (const configKey of requiredConfig) {
      if (!process.env[configKey]) {
        throw new ConfigurationException(
          `Variable de entorno requerida no encontrada: ${configKey}`
        );
      }
    }
  }

  /**
   * Ejemplo de manejo de errores genéricos de negocio (400)
   */
  static async processBusinessLogic(data: any) {
    if (data.amount < 0) {
      throw new BusinessException(
        'El monto no puede ser negativo',
        'INVALID_AMOUNT',
        { amount: data.amount }
      );
    }
    
    if (data.currency && !['USD', 'EUR', 'COP'].includes(data.currency)) {
      throw new BusinessException(
        'Moneda no soportada',
        'UNSUPPORTED_CURRENCY',
        { currency: data.currency, supportedCurrencies: ['USD', 'EUR', 'COP'] }
      );
    }
  }

  // Métodos auxiliares simulados
  private static async findUserByEmail(email: string) {
    // Simulación de búsqueda de usuario
    return null;
  }

  private static async findUserById(userId: string) {
    // Simulación de búsqueda de usuario
    return null;
  }

  private static async verifyPassword(password: string, hashedPassword: string) {
    // Simulación de verificación de contraseña
    return false;
  }

  private static userRepository = {
    findById: async (id: string) => null
  };

  private static database = {
    save: async (data: any) => {
      throw new Error('Database connection failed');
    }
  };

  private static httpClient = {
    post: async (url: string, data: any) => {
      throw new Error('Network error');
    }
  };
}

/**
 * Ejemplo de respuesta de error estándar:
 * 
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Credenciales inválidas. Verifique su email y contraseña.",
 *     "errorCode": "AUTHENTICATION_ERROR",
 *     "details": null,
 *     "timestamp": "2024-01-15T10:30:00.000Z",
 *     "statusCode": 401
 *   },
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "path": "auth-login",
 *   "requestId": "req-123456"
 * }
 */
