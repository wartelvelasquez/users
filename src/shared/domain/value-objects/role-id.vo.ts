import { v4 as uuidv4, validate as isValidUuid } from 'uuid';

/**
 * RoleId Value Object
 * 
 * Representa un identificador único para un rol siguiendo el patrón DDD.
 * Usa UUID v4 para garantizar unicidad global.
 * 
 * Similar a UserId pero específico para roles.
 */
export class RoleId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  /**
   * Genera un nuevo RoleId
   */
  public static generate(): RoleId {
    return new RoleId(uuidv4());
  }

  /**
   * Crea un RoleId desde un string UUID
   * @throws Error si el UUID es inválido
   */
  public static fromString(id: string): RoleId {
    if (!id || id.trim().length === 0) {
      throw new Error('RoleId cannot be empty');
    }

    const trimmedId = id.trim();

    if (!isValidUuid(trimmedId)) {
      throw new Error('Invalid RoleId format: must be a valid UUID');
    }

    return new RoleId(trimmedId);
  }

  /**
   * Crea un RoleId opcional (puede ser undefined)
   */
  public static fromStringOptional(id?: string): RoleId | undefined {
    if (!id) return undefined;
    return this.fromString(id);
  }

  /**
   * Compara dos RoleId por valor
   */
  public equals(other: RoleId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  /**
   * Valida si un string es un RoleId válido
   */
  public static isValid(id: string): boolean {
    return isValidUuid(id);
  }

  public toString(): string {
    return this._value;
  }
}

