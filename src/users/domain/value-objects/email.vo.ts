export class Email {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email format');
    }
    this._value = value.toLowerCase().trim();
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  getDomain(): string {
    return this._value.split('@')[1];
  }

  getLocalPart(): string {
    return this._value.split('@')[0];
  }

  private isValid(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  static fromString(value: string): Email {
    return new Email(value);
  }
}
