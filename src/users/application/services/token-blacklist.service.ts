import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private blacklistedTokens = new Set<string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Agrega un token a la lista negra
   */
  addToBlacklist(token: string): void {
    try {
      // Decodificar el token para obtener el jti (JWT ID) si existe
      const decoded = this.jwtService.decode(token) as any;
      const tokenId = decoded?.jti || token; // Usar jti si existe, sino el token completo
      
      this.blacklistedTokens.add(tokenId);
      this.logger.log(`Token added to blacklist: ${tokenId.substring(0, 10)}...`);
    } catch (error) {
      this.logger.warn('Error adding token to blacklist:', error.message);
      // Si no se puede decodificar, agregar el token completo
      this.blacklistedTokens.add(token);
    }
  }

  /**
   * Verifica si un token está en la lista negra
   */
  isBlacklisted(token: string): boolean {
    try {
      const decoded = this.jwtService.decode(token) as any;
      const tokenId = decoded?.jti || token;
      return this.blacklistedTokens.has(tokenId);
    } catch (error) {
      this.logger.warn('Error checking token blacklist:', error.message);
      return this.blacklistedTokens.has(token);
    }
  }

  /**
   * Remueve un token de la lista negra (útil para refresh tokens)
   */
  removeFromBlacklist(token: string): void {
    try {
      const decoded = this.jwtService.decode(token) as any;
      const tokenId = decoded?.jti || token;
      this.blacklistedTokens.delete(tokenId);
      this.logger.log(`Token removed from blacklist: ${tokenId.substring(0, 10)}...`);
    } catch (error) {
      this.logger.warn('Error removing token from blacklist:', error.message);
      this.blacklistedTokens.delete(token);
    }
  }

  /**
   * Limpia tokens expirados de la lista negra
   */
  cleanExpiredTokens(): void {
    const now = Math.floor(Date.now() / 1000);
    const initialSize = this.blacklistedTokens.size;
    
    for (const tokenId of this.blacklistedTokens) {
      try {
        // Si es un JWT, verificar si está expirado
        if (tokenId.includes('.')) {
          const decoded = this.jwtService.decode(tokenId) as any;
          if (decoded && decoded.exp && decoded.exp < now) {
            this.blacklistedTokens.delete(tokenId);
          }
        }
      } catch (error) {
        // Si no se puede decodificar, mantenerlo en la lista
        continue;
      }
    }
    
    const cleanedCount = initialSize - this.blacklistedTokens.size;
    if (cleanedCount > 0) {
      this.logger.log(`Cleaned ${cleanedCount} expired tokens from blacklist`);
    }
  }

  /**
   * Obtiene el tamaño actual de la lista negra
   */
  getBlacklistSize(): number {
    return this.blacklistedTokens.size;
  }
}
