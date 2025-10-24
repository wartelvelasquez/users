import * as bcrypt from 'bcrypt';

export class Password {
  private readonly _value: string;
  private readonly _isHashed: boolean;

  constructor(value: string, isHashed: boolean = false) {
    if (!isHashed && !this.isValidPassword(value)) {
      throw new Error('Password does not meet security requirements');
    }
    this._value = value;
    this._isHashed = isHashed;
  }

  get value(): string {
    return this._value;
  }

  get isHashed(): boolean {
    return this._isHashed;
  }

  equals(other: Password): boolean {
    return this._value === other._value && this._isHashed === other._isHashed;
  }

  toString(): string {
    return this._isHashed ? '[HASHED]' : '[PLAIN]';
  }

  private isValidPassword(password: string): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // Minimum 8 characters
    if (password.length < 8) {
      return false;
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // At least one number
    if (!/\d/.test(password)) {
      return false;
    }

    // At least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return false;
    }

    return true;
  }

  static async fromPlainText(value: string): Promise<Password> {
    const hashedValue = await bcrypt.hash(value, 10);
    return new Password(hashedValue, true);
  }

  static fromHash(value: string): Password {
    return new Password(value, true);
  }

  static getRequirements(): string[] {
    return [
      'Minimum 8 characters',
      'At least one uppercase letter',
      'At least one lowercase letter',
      'At least one number',
      'At least one special character',
    ];
  }
}