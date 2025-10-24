import * as bcrypt from 'bcrypt';

export class Password {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  static fromPlainText(plainText: string): Password {
    if (!plainText || plainText.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const hashedPassword = bcrypt.hashSync(plainText, 12);
    return new Password(hashedPassword);
  }

  static fromHash(hash: string): Password {
    if (!hash || hash.trim().length === 0) {
      throw new Error('Password hash cannot be empty');
    }
    return new Password(hash);
  }

  verify(plainText: string): boolean {
    return bcrypt.compareSync(plainText, this._value);
  }

  /**
   * Compara una contraseña plana con el hash (alias de verify)
   */
  async compare(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this._value);
  }

  equals(other: Password): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
