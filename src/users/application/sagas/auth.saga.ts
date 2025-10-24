import { Injectable } from '@nestjs/common';
import { Saga, ofType } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Importar eventos de auth
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import { UserRegistrationFailedEvent } from '../../domain/events/user-registration-failed.event';
import { UserLoginSuccessEvent } from '../../domain/events/user-login-success.event';
import { UserLoginFailedEvent } from '../../domain/events/user-login-failed.event';
import { PhoneLoginSuccessEvent } from '../../domain/events/phone-login-success.event';
import { PhoneLoginFailedEvent } from '../../domain/events/phone-login-failed.event';
import { EmailVerificationSuccessEvent } from '../../domain/events/email-verification-success.event';
import { EmailVerificationFailedEvent } from '../../domain/events/email-verification-failed.event';
import { TokenRefreshSuccessEvent } from '../../domain/events/token-refresh-success.event';
import { TokenRefreshFailedEvent } from '../../domain/events/token-refresh-failed.event';
import { UserValidationSuccessEvent } from '../../domain/events/user-validation-success.event';
import { UserValidationFailedEvent } from '../../domain/events/user-validation-failed.event';
import { UserLogoutEvent } from '../../domain/events/user-logout.event';

@Injectable()
export class AuthSaga {
  
  // ========================================
  // SAGAS PARA REGISTRO DE USUARIO
  // ========================================

  // Solo logueamos el éxito del registro
  @Saga()
  userRegistered = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      ofType(UserRegisteredEvent),
      map(event => {
        console.log(`✅ User registered successfully: ${event.userId}`);
        console.log(`📧 Email: ${event.email}`);
        console.log(`📋 User data: ${JSON.stringify(event.userData)}`);
        console.log(`⏰ Timestamp: ${event.occurredAt.toISOString()}`);
        // Aquí puedes agregar tracking básico o logging
        // Por ejemplo: enviar a sistemas de monitoreo, actualizar métricas, etc.
      })
    );
  };

  // Solo logueamos el fallo del registro
  @Saga()
  userRegistrationFailed = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      ofType(UserRegistrationFailedEvent),
      map(event => {
        console.error(`❌ User registration failed: ${event.email}`);
        console.error(`📧 Email: ${event.email}`);
        console.error(`❌ Error: ${event.error}`);
        console.error(`📋 User data: ${JSON.stringify(event.userData)}`);
        console.error(`⏰ Timestamp: ${event.timestamp.toISOString()}`);
        // Aquí puedes agregar tracking de errores
        // Por ejemplo: enviar alertas, registrar en sistemas de monitoreo, etc.
      })
    );
  };

  // ========================================
  // SAGAS PARA LOGIN DE USUARIO
  // ========================================

  // Saga para login exitoso
  @Saga()
  userLoginSuccess = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      ofType(UserLoginSuccessEvent),
      map(event => {
        console.log(`🔐 User login successful: ${event.userId}`);
        console.log(`📧 Email: ${event.email}`);
        console.log(`📋 Login data: ${JSON.stringify(event.loginData)}`);
        console.log(`⏰ Timestamp: ${event.occurredAt.toISOString()}`);
        // Aquí puedes agregar lógica post-login
        // Por ejemplo: actualizar última sesión, registrar métricas de acceso, etc.
      })
    );
  };

  // Saga para fallo en login
  @Saga()
  userLoginFailed = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      ofType(UserLoginFailedEvent),
      map(event => {
        console.error(`❌ User login failed: ${event.email}`);
        console.error(`📧 Email: ${event.email}`);
        console.error(`❌ Error: ${event.error}`);
        console.error(`📋 Login data: ${JSON.stringify(event.loginData)}`);
        console.error(`⏰ Timestamp: ${event.timestamp.toISOString()}`);
        // Aquí puedes agregar lógica de seguridad
        // Por ejemplo: incrementar contador de intentos fallidos, bloquear IP, etc.
      })
    );
  };

  // ========================================
  // SAGAS PARA LOGIN POR TELÉFONO
  // ========================================

  // Saga para login por teléfono exitoso
  @Saga()
  phoneLoginSuccess = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      ofType(PhoneLoginSuccessEvent),
      map(event => {
        console.log(`📱 Phone login successful: ${event.userId}`);
        console.log(`📞 Phone: ${event.phone}`);
        console.log(`📋 Login data: ${JSON.stringify(event.loginData)}`);
        console.log(`⏰ Timestamp: ${event.timestamp.toISOString()}`);
        // Aquí puedes agregar lógica post-login por teléfono
        // Por ejemplo: validar número de teléfono, registrar métricas, etc.
      })
    );
  };

  // Saga para fallo en login por teléfono
  @Saga()
  phoneLoginFailed = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      ofType(PhoneLoginFailedEvent),
      map(event => {
        console.error(`❌ Phone login failed: ${event.phone}`);
        console.error(`📞 Phone: ${event.phone}`);
        console.error(`❌ Error: ${event.error}`);
        console.error(`📋 Login data: ${JSON.stringify(event.loginData)}`);
        console.error(`⏰ Timestamp: ${event.timestamp.toISOString()}`);
        // Aquí puedes agregar lógica de seguridad para teléfono
        // Por ejemplo: validar formato de teléfono, registrar intentos fallidos, etc.
      })
    );
  };

  // ========================================
  // SAGAS PARA VERIFICACIÓN DE EMAIL
  // ========================================

  // Saga para verificación de email exitosa
  @Saga()
  emailVerificationSuccess = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      ofType(EmailVerificationSuccessEvent),
      map(event => {
        console.log(`📧 Email verification successful: ${event.userId}`);
        console.log(`📧 Email: ${event.email}`);
        console.log(`🔑 Token: ${event.token}`);
        console.log(`⏰ Timestamp: ${event.timestamp.toISOString()}`);
        // Aquí puedes agregar lógica post-verificación
        // Por ejemplo: activar cuenta, enviar notificación de bienvenida, etc.
      })
    );
  };

  // Saga para fallo en verificación de email
  @Saga()
  emailVerificationFailed = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      ofType(EmailVerificationFailedEvent),
      map(event => {
        console.error(`❌ Email verification failed`);
        console.error(`🔑 Token: ${event.token}`);
        console.error(`❌ Error: ${event.error}`);
        console.error(`⏰ Timestamp: ${event.timestamp.toISOString()}`);
        // Aquí puedes agregar lógica de compensación
        // Por ejemplo: reenviar email de verificación, notificar administradores, etc.
      })
    );
  };

  // ========================================
  // SAGAS PARA REFRESH DE TOKEN
  // ========================================

  // Saga para refresh de token exitoso
  @Saga()
  tokenRefreshSuccess = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      ofType(TokenRefreshSuccessEvent),
      map(event => {
        console.log(`🔄 Token refresh successful: ${event.userId}`);
        console.log(`📧 Email: ${event.email}`);
        console.log(`📋 Refresh data: ${JSON.stringify(event.refreshData)}`);
        console.log(`⏰ Timestamp: ${event.timestamp.toISOString()}`);
        // Aquí puedes agregar lógica post-refresh
        // Por ejemplo: actualizar métricas de sesión, registrar actividad, etc.
      })
    );
  };

  // Saga para fallo en refresh de token
  @Saga()
  tokenRefreshFailed = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      ofType(TokenRefreshFailedEvent),
      map(event => {
        console.error(`❌ Token refresh failed`);
        console.error(`🔑 Token: ${event.refreshToken}`);
        console.error(`❌ Error: ${event.error}`);
        console.error(`📋 Refresh data: ${JSON.stringify(event.refreshData)}`);
        console.error(`⏰ Timestamp: ${event.timestamp.toISOString()}`);
        // Aquí puedes agregar lógica de compensación
        // Por ejemplo: invalidar sesión, notificar seguridad, etc.
      })
    );
  };

  // ========================================
  // SAGAS PARA VALIDACIÓN DE USUARIO
  // ========================================

  // Saga para validación de usuario exitosa
  @Saga()
  userValidationSuccess = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      ofType(UserValidationSuccessEvent),
      map(event => {
        console.log(`✅ User validation successful: ${event.userId}`);
        console.log(`📋 Validation data: ${JSON.stringify(event.validationData)}`);
        console.log(`⏰ Timestamp: ${event.timestamp.toISOString()}`);
        // Aquí puedes agregar lógica post-validación
        // Por ejemplo: actualizar caché, registrar acceso, etc.
      })
    );
  };

  // Saga para fallo en validación de usuario
  @Saga()
  userValidationFailed = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      ofType(UserValidationFailedEvent),
      map(event => {
        console.error(`❌ User validation failed: ${event.userId}`);
        console.error(`❌ Error: ${event.error}`);
        console.error(`📋 Validation data: ${JSON.stringify(event.validationData)}`);
        console.error(`⏰ Timestamp: ${event.timestamp.toISOString()}`);
        // Aquí puedes agregar lógica de compensación
        // Por ejemplo: bloquear acceso, notificar administradores, etc.
      })
    );
  };

  // ========================================
  // SAGAS PARA LOGOUT
  // ========================================

  // Saga para logout de usuario
  @Saga()
  userLogout = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      ofType(UserLogoutEvent),
      map(event => {
        console.log(`🚪 User logout: ${event.userId}`);
        console.log(`📧 Email: ${event.email}`);
        console.log(`📋 Logout data: ${JSON.stringify(event.logoutData)}`);
        console.log(`⏰ Timestamp: ${event.timestamp.toISOString()}`);
        // Aquí puedes agregar lógica post-logout
        // Por ejemplo: invalidar tokens, limpiar sesión, etc.
      })
    );
  };

  // ========================================
  // SAGA DE MONITOREO GENERAL
  // ========================================

  // Saga de monitoreo general que se activa por cualquier evento de auth
  @Saga()
  authActivityMonitor = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      // Escuchar todos los eventos de auth
      map(event => {
        const eventType = event.constructor.name;
        const userId = event.userId || event.email || event.phone || 'unknown';
        
        console.log(`📊 Users Saga de monitoreo: Evento detectado ${eventType} para usuario ${userId}`);
        console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
        
        // Aquí puedes agregar métricas, alertas, etc.
        // Por ejemplo: incrementar contadores, enviar a sistemas de monitoreo, etc.
        
        return; // No retornamos comandos, solo monitoreo
      })
    );
  };

  // ========================================
  // SAGA DE SEGURIDAD
  // ========================================

  // Saga especializada en eventos de seguridad
  @Saga()
  securityMonitor = (events$: Observable<any>): Observable<void> => {
    return events$.pipe(
      map(event => {
        const eventType = event.constructor.name;
        
        // Monitorear eventos de fallo que podrían indicar problemas de seguridad
        if (eventType.includes('Failed') || eventType.includes('Error')) {
          console.warn(`🚨 Security Alert: ${eventType} detected`);
          console.warn(`⏰ Timestamp: ${new Date().toISOString()}`);
          console.warn(`📋 Event data: ${JSON.stringify(event)}`);
          
          // Aquí puedes agregar lógica de seguridad
          // Por ejemplo: alertas automáticas, bloqueos temporales, etc.
        }
        
        return;
      })
    );
  };
}


