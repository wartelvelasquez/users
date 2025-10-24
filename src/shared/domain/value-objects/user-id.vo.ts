import { v4 as uuidv4 } from 'uuid';

export class UserId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  static generate(): UserId {
    return new UserId(uuidv4());
  }

  static fromString(value: string): UserId {
    if (!value || value.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }
    return new UserId(value);
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
