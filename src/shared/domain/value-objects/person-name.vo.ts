/**
 * PersonName Value Object
 * 
 * Representa el nombre de una persona siguiendo el patrón DDD.
 * Encapsula las reglas de negocio relacionadas con nombres:
 * - Validación de formato
 * - Normalización (trim, capitalización)
 * - Longitud mínima/máxima
 * - Caracteres permitidos
 */
export class PersonName {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  /**
   * Crea un PersonName desde un string
   * @throws Error si el nombre es inválido
   */
  public static create(name: string): PersonName {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (trimmedName.length > 50) {
      throw new Error('Name cannot exceed 50 characters');
    }

    // Validar que solo contenga letras, espacios, guiones y apóstrofes
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
    if (!nameRegex.test(trimmedName)) {
      throw new Error('Name contains invalid characters');
    }

    return new PersonName(this.normalize(trimmedName));
  }

  /**
   * Crea un PersonName sin validación (usado al cargar desde BD)
   */
  public static fromPersistence(name: string): PersonName {
    return new PersonName(name);
  }

  /**
   * Normaliza el nombre: trim y capitaliza primera letra de cada palabra
   */
  private static normalize(name: string): string {
    return name
      .trim()
      .split(' ')
      .map(word => {
        if (word.length === 0) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  /**
   * Compara dos PersonName por valor
   */
  public equals(other: PersonName): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  /**
   * Retorna el nombre completo combinando firstName y lastName
   */
  public static getFullName(firstName: PersonName, lastName: PersonName): string {
    return `${firstName.value} ${lastName.value}`;
  }

  /**
   * Retorna las iniciales del nombre
   */
  public getInitials(): string {
    return this._value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  public toString(): string {
    return this._value;
  }
}

