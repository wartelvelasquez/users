/**
 * CountryCode Value Object
 * 
 * Representa un código de país siguiendo el patrón DDD.
 * Soporta códigos ISO 3166-1 alpha-2 (2 letras) y alpha-3 (3 letras)
 * 
 * Ejemplos: CO, US, MX, ESP, USA, COL
 */
export class CountryCode {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  /**
   * Crea un CountryCode desde un string
   * @throws Error si el código es inválido
   */
  public static create(code: string): CountryCode {
    if (!code || code.trim().length === 0) {
      throw new Error('Country code cannot be empty');
    }

    const normalized = code.trim().toUpperCase();

    // Validar longitud (2 o 3 caracteres para ISO)
    if (normalized.length < 2 || normalized.length > 3) {
      throw new Error('Country code must be 2 or 3 characters (ISO 3166-1)');
    }

    // Validar que solo contenga letras
    const codeRegex = /^[A-Z]{2,3}$/;
    if (!codeRegex.test(normalized)) {
      throw new Error('Country code must contain only letters');
    }

    return new CountryCode(normalized);
  }

  /**
   * Crea un CountryCode opcional (puede ser undefined)
   */
  public static createOptional(code?: string): CountryCode | undefined {
    if (!code) return undefined;
    return this.create(code);
  }

  /**
   * Crea un CountryCode sin validación (usado al cargar desde BD)
   */
  public static fromPersistence(code: string): CountryCode {
    return new CountryCode(code.toUpperCase());
  }

  /**
   * Crea un CountryCode opcional sin validación
   */
  public static fromPersistenceOptional(code?: string): CountryCode | undefined {
    if (!code) return undefined;
    return new CountryCode(code.toUpperCase());
  }

  /**
   * Compara dos CountryCode por valor
   */
  public equals(other: CountryCode): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  /**
   * Verifica si es formato ISO alpha-2 (2 letras)
   */
  public isAlpha2(): boolean {
    return this._value.length === 2;
  }

  /**
   * Verifica si es formato ISO alpha-3 (3 letras)
   */
  public isAlpha3(): boolean {
    return this._value.length === 3;
  }

  /**
   * Retorna el nombre del país (requeriría un servicio externo o mapa estático)
   * Por ahora retorna el código
   */
  public getCountryName(): string {
    // TODO: Implementar mapeo código -> nombre
    // Podría usar una librería como i18n-iso-countries
    return this._value;
  }

  public toString(): string {
    return this._value;
  }
}

