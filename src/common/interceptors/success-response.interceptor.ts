import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SuccessResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SuccessResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToRpc();
    const data = ctx.getData();
    const pattern = ctx.getContext()?.getPattern?.() || 'unknown';

    return next.handle().pipe(
      map((response) => {
        // Si la respuesta ya tiene el formato correcto, la devolvemos tal como está
        if (response && typeof response === 'object' && 'success' in response) {
          return response;
        }

        // Determinar el código de estado basado en el patrón
        let statusCode = 200;
        let message = 'Operación exitosa';

        if (pattern.includes('register') || pattern.includes('create')) {
          statusCode = 201;
          message = 'Recurso creado exitosamente';
        } else if (pattern.includes('login')) {
          message = 'Inicio de sesión exitoso';
        } else if (pattern.includes('update')) {
          message = 'Recurso actualizado exitosamente';
        } else if (pattern.includes('delete')) {
          message = 'Recurso eliminado exitosamente';
        }

        const successResponse = {
          success: true,
          data: response,
          message,
          timestamp: new Date().toISOString(),
          statusCode,
          path: pattern,
          requestId: data?.requestId || 'unknown',
        };

        this.logger.log(
          `Success Response: ${message}`,
          {
            pattern,
            requestId: data?.requestId,
            statusCode,
          }
        );

        return successResponse;
      })
    );
  }
}
