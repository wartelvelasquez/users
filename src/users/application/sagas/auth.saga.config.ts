/**
 * CONFIGURACIÓN DE LAS AUTH SAGAS
 * 
 * Este archivo contiene la configuración para personalizar
 * el comportamiento de las sagas de autenticación.
 */

export interface AuthSagaConfig {
  // Configuración de logging
  logging: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    includeTimestamps: boolean;
    includeUserData: boolean;
  };
  
  // Configuración de monitoreo
  monitoring: {
    enabled: boolean;
    trackFailedAttempts: boolean;
    alertThreshold: number; // Número de intentos fallidos antes de alertar
  };
  
  // Configuración de seguridad
  security: {
    enabled: boolean;
    blockAfterFailedAttempts: number;
    blockDurationMinutes: number;
    alertOnSuspiciousActivity: boolean;
  };
  
  // Configuración de métricas
  metrics: {
    enabled: boolean;
    trackSuccessRate: boolean;
    trackResponseTime: boolean;
    exportToExternalSystem: boolean;
  };
}

export const defaultAuthSagaConfig: AuthSagaConfig = {
  logging: {
    enabled: true,
    logLevel: 'info',
    includeTimestamps: true,
    includeUserData: true,
  },
  monitoring: {
    enabled: true,
    trackFailedAttempts: true,
    alertThreshold: 5,
  },
  security: {
    enabled: true,
    blockAfterFailedAttempts: 10,
    blockDurationMinutes: 30,
    alertOnSuspiciousActivity: true,
  },
  metrics: {
    enabled: true,
    trackSuccessRate: true,
    trackResponseTime: true,
    exportToExternalSystem: false,
  },
};

/**
 * Configuración personalizada para diferentes entornos
 */
export const authSagaConfigs = {
  development: {
    ...defaultAuthSagaConfig,
    logging: {
      ...defaultAuthSagaConfig.logging,
      logLevel: 'debug' as const,
    },
  },
  
  production: {
    ...defaultAuthSagaConfig,
    logging: {
      ...defaultAuthSagaConfig.logging,
      logLevel: 'warn' as const,
      includeUserData: false, // No incluir datos sensibles en producción
    },
    security: {
      ...defaultAuthSagaConfig.security,
      blockAfterFailedAttempts: 5, // Más estricto en producción
      blockDurationMinutes: 60,
    },
  },
  
  testing: {
    ...defaultAuthSagaConfig,
    logging: {
      ...defaultAuthSagaConfig.logging,
      enabled: false, // Deshabilitar logging en tests
    },
    monitoring: {
      ...defaultAuthSagaConfig.monitoring,
      enabled: false,
    },
    security: {
      ...defaultAuthSagaConfig.security,
      enabled: false,
    },
  },
};

/**
 * Función para obtener la configuración según el entorno
 */
export function getAuthSagaConfig(environment: string = 'development'): AuthSagaConfig {
  return authSagaConfigs[environment as keyof typeof authSagaConfigs] || defaultAuthSagaConfig;
}

/**
 * Constantes para los emojis y mensajes de logging
 */
export const USER_SAGA_MESSAGES = {
  SUCCESS: {
    USER_REGISTERED: '✅ User registered successfully',
    USER_LOGIN: '🔐 User login successful',
    PHONE_LOGIN: '📱 Phone login successful',
    EMAIL_VERIFICATION: '📧 Email verification successful',
  },
  ERROR: {
    USER_REGISTRATION_FAILED: '❌ User registration failed',
    USER_LOGIN_FAILED: '❌ User login failed',
    PHONE_LOGIN_FAILED: '❌ Phone login failed',
    EMAIL_VERIFICATION_FAILED: '❌ Email verification failed',
  },
  MONITORING: {
    ACTIVITY_DETECTED: '📊 Users Saga de monitoreo: Evento detectado',
    SECURITY_ALERT: '🚨 Security Alert',
  },
  FIELDS: {
    USER_ID: 'User ID',
    EMAIL: 'Email',
    PHONE: 'Phone',
    TOKEN: 'Token',
    ERROR: 'Error',
    DATA: 'Data',
    TIMESTAMP: 'Timestamp',
  },
} as const;


