/**
 * Phone Value Object
 * 
 * Representa un número telefónico siguiendo el patrón DDD.
 * Encapsula las reglas de negocio relacionadas con teléfonos:
 * - Formato internacional
 * - Validación básica
 * - Normalización
 * 
 * Formato esperado: +[código país][número] o número local
 * Ejemplo: +573001234567 o 3001234567
 */
export class Phone {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  /**
   * Crea un Phone desde un string
   * @throws Error si el teléfono es inválido
   */
  public static create(phone: string): Phone {
    if (!phone || phone.trim().length === 0) {
      throw new Error('Phone number cannot be empty');
    }

    const normalized = this.normalize(phone);

    // Validar longitud (entre 7 y 15 dígitos según estándar E.164)
    const digitsOnly = normalized.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      throw new Error('Phone number must be between 7 and 15 digits');
    }

    // Validar formato básico
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    if (!phoneRegex.test(normalized)) {
      throw new Error('Invalid phone number format');
    }

    return new Phone(normalized);
  }

  /**
   * Crea un Phone opcional (puede ser undefined)
   */
  public static createOptional(phone?: string): Phone | undefined {
    if (!phone) return undefined;
    return this.create(phone);
  }

  /**
   * Crea un Phone sin validación (usado al cargar desde BD)
   */
  public static fromPersistence(phone: string): Phone {
    return new Phone(phone);
  }

  /**
   * Crea un Phone opcional sin validación
   */
  public static fromPersistenceOptional(phone?: string): Phone | undefined {
    if (!phone) return undefined;
    return new Phone(phone);
  }

  /**
   * Normaliza el número telefónico
   * - Elimina espacios, guiones, paréntesis
   * - Mantiene el símbolo +
   */
  private static normalize(phone: string): string {
    let normalized = phone.trim();
    
    // Eliminar caracteres comunes pero mantener +
    normalized = normalized.replace(/[\s\-()\.]/g, '');
    
    return normalized;
  }

  /**
   * Compara dos Phone por valor
   */
  public equals(other: Phone): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  /**
   * Verifica si es un número internacional (empieza con +)
   */
  public isInternational(): boolean {
    return this._value.startsWith('+');
  }

  /**
   * Retorna solo los dígitos del teléfono
   */
  public getDigitsOnly(): string {
    return this._value.replace(/\D/g, '');
  }

  /**
   * Formatea el teléfono para mostrar (ej: +57 300 123 4567)
   */
  public format(): string {
    const digits = this.getDigitsOnly();
    
    if (this.isInternational()) {
      // Formato internacional simple
      return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`.trim();
    }
    
    // Formato local (depende del país, este es genérico)
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }

  public toString(): string {
    return this._value;
  }
}

